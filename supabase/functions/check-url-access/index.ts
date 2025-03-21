
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
};

interface URLAccessResponse {
  isAccessible: boolean;
  hasScrapingRestrictions: boolean;
  statusCode?: number;
  contentType?: string;
  robotsRestrictions?: string[];
  metaRestrictions?: string[];
  canScrape: boolean; // This is required
  content?: string;
  error?: string;
}

// Simple HTML content extractor function
function extractContent(html: string): string {
  try {
    // Remove scripts
    let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    // Remove styles
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    // Remove HTML comments
    content = content.replace(/<!--[\s\S]*?-->/g, ' ');
    // Replace all html tags with spaces
    content = content.replace(/<[^>]*>/g, ' ');
    // Replace multiple spaces with single space
    content = content.replace(/\s+/g, ' ');
    // Remove leading/trailing whitespace
    content = content.trim();
    
    return content;
  } catch (error) {
    console.error("Error extracting content:", error);
    return "";
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestJson = await req.json().catch(err => {
      console.error("Error parsing request JSON:", err);
      throw new Error("Invalid JSON in request body");
    });
    
    const { url } = requestJson;

    if (!url) {
      return new Response(
        JSON.stringify({ 
          error: 'URL is required',
          isAccessible: false,
          hasScrapingRestrictions: true,
          canScrape: false // Ensure canScrape is always set
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ 
          isAccessible: false, 
          hasScrapingRestrictions: true,
          canScrape: false, // Ensure canScrape is always set
          error: 'Invalid URL format' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check URL accessibility with retries
    const maxRetries = 3;
    let lastError: string | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Attempt ${i+1} to check URL: ${url}`);
        
        // Try GET instead of HEAD to get more information
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WelcomeChatBot/1.0; +https://welcomechat.ai)'
          },
        });

        const contentType = response.headers.get('Content-Type') || '';
        const statusCode = response.status;
        
        console.log(`Response status: ${statusCode}, Content-Type: ${contentType}`);

        if (response.ok) {
          // Check for restrictions that might affect scrapability
          let hasScrapingRestrictions = false;
          const robotsRestrictions: string[] = [];
          const metaRestrictions: string[] = [];
          
          // Check robots.txt
          try {
            const urlObj = new URL(url);
            const robotsUrl = `${urlObj.protocol}//${urlObj.hostname}/robots.txt`;
            console.log(`Checking robots.txt at: ${robotsUrl}`);
            
            const robotsResponse = await fetch(robotsUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; WelcomeChatBot/1.0; +https://welcomechat.ai)'
              },
            });

            if (robotsResponse.ok) {
              const robotsText = await robotsResponse.text();
              
              // Check for generic disallow rules
              if (robotsText.toLowerCase().includes('disallow: /')) {
                hasScrapingRestrictions = true;
                robotsRestrictions.push('Site has crawling restrictions in robots.txt');
              }
              
              // Check for specific bot restrictions
              const botSpecificLines = robotsText.split('\n').filter(line => 
                line.toLowerCase().includes('user-agent:') && 
                line.toLowerCase().includes('bot')
              );
              
              if (botSpecificLines.length > 0) {
                robotsRestrictions.push('Site has bot-specific rules in robots.txt');
              }
              
              console.log(`Robots.txt found, has restrictions: ${hasScrapingRestrictions}`);
            }
          } catch (robotsError) {
            console.error('Error checking robots.txt:', robotsError);
            // If we can't check robots.txt, assume no restrictions but log the error
          }
          
          // Extract page content if it's HTML
          let content = '';
          if (contentType.includes('text/html')) {
            const pageText = await response.text();
            
            // Check for noindex, nofollow meta tags
            if (pageText.toLowerCase().includes('name="robots" content="noindex') || 
                pageText.toLowerCase().includes('name="robots" content="none') ||
                pageText.toLowerCase().includes('name="robots" content="nofollow')) {
              hasScrapingRestrictions = true;
              metaRestrictions.push('Page has noindex or nofollow meta tags');
            }
            
            // Check for other potential scraping obstacles
            if (pageText.toLowerCase().includes('captcha') || 
                pageText.toLowerCase().includes('recaptcha')) {
              metaRestrictions.push('Page might use CAPTCHA which could hinder scraping');
            }

            // Extract content from HTML using our custom function
            content = extractContent(pageText);
            
            // If extraction didn't yield meaningful content, try a simpler approach
            if (!content || content.length < 100) {
              // Basic extraction as fallback
              content = pageText
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            }
          } else if (contentType.includes('text/plain')) {
            // For plain text, just get the raw content
            content = await response.text();
          }

          // Set canScrape based on restrictions
          const canScrape = !hasScrapingRestrictions && metaRestrictions.length === 0;

          const result: URLAccessResponse = {
            isAccessible: true,
            hasScrapingRestrictions,
            robotsRestrictions: robotsRestrictions.length > 0 ? robotsRestrictions : undefined,
            metaRestrictions: metaRestrictions.length > 0 ? metaRestrictions : undefined,
            statusCode,
            contentType,
            canScrape,
            content: content || undefined
          };

          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          lastError = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          const waitTime = Math.pow(2, i) * 1000;
          console.log(`Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // If we get here, all retries failed
    console.error(`Failed to access URL after ${maxRetries} attempts: ${lastError}`);
    return new Response(
      JSON.stringify({ 
        isAccessible: false, 
        hasScrapingRestrictions: true,
        canScrape: false, // Ensure canScrape is always set
        error: `Failed to access URL after ${maxRetries} attempts. Last error: ${lastError}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking URL access:', error);
    return new Response(
      JSON.stringify({ 
        isAccessible: false, 
        hasScrapingRestrictions: true,
        canScrape: false, // Ensure canScrape is always set
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
