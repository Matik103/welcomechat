import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface CheckResult {
  isAccessible: boolean;
  isCrawlable: boolean;
  isScrapable: boolean;
  error?: string;
}

async function checkRobotsTxt(baseUrl: string): Promise<{ crawlable: boolean; scrapable: boolean }> {
  try {
    const url = new URL(baseUrl);
    const robotsTxtUrl = `${url.protocol}//${url.host}/robots.txt`;
    const response = await fetch(robotsTxtUrl);
    
    if (!response.ok) {
      // If no robots.txt, assume allowed
      return { crawlable: true, scrapable: true };
    }

    const text = await response.text();
    const userAgentSections = text.toLowerCase().split('user-agent:');
    let crawlable = true;
    let scrapable = true;

    // Check both * and specific bot sections
    for (const section of userAgentSections) {
      if (section.includes('*') || section.includes('bot')) {
        if (section.includes('disallow: /')) {
          crawlable = false;
        }
        // Look for specific scraping disallow rules
        if (section.includes('disallow: /api') || 
            section.includes('disallow: /data') ||
            section.includes('crawl-delay:')) {
          scrapable = false;
        }
      }
    }

    return { crawlable, scrapable };
  } catch (error) {
    console.error('Error checking robots.txt:', error);
    // If error checking robots.txt, assume allowed
    return { crawlable: true, scrapable: true };
  }
}

async function checkMetaTags(url: string): Promise<{ crawlable: boolean; scrapable: boolean }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const crawlable = !html.toLowerCase().includes('noindex');
    const scrapable = !html.toLowerCase().includes('nofollow') && 
                     !html.toLowerCase().includes('noarchive') &&
                     !html.toLowerCase().includes('nocache');

    return { crawlable, scrapable };
  } catch (error) {
    console.error('Error checking meta tags:', error);
    return { crawlable: true, scrapable: true };
  }
}

async function checkUrlAccess(url: string): Promise<CheckResult> {
  try {
    // First check if URL is accessible
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WelcomeChatBot/1.0; +https://welcomechat.ai)'
      }
    });

    if (!response.ok) {
      return {
        isAccessible: false,
        isCrawlable: false,
        isScrapable: false,
        error: `URL returned status ${response.status}`
      };
    }

    // Check robots.txt and meta tags in parallel
    const [robotsCheck, metaCheck] = await Promise.all([
      checkRobotsTxt(url),
      checkMetaTags(url)
    ]);

    // Combine results
    const isCrawlable = robotsCheck.crawlable && metaCheck.crawlable;
    const isScrapable = robotsCheck.scrapable && metaCheck.scrapable;

    return {
      isAccessible: true,
      isCrawlable,
      isScrapable,
      error: !isCrawlable ? "URL is not crawlable" :
             !isScrapable ? "URL is not scrapable" : undefined
    };
  } catch (error) {
    console.error('Error checking URL:', error);
    return {
      isAccessible: false,
      isCrawlable: false,
      isScrapable: false,
      error: error.message
    };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await checkUrlAccess(url);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});