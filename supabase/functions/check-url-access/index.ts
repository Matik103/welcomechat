
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface URLAccessResponse {
  isAccessible: boolean;
  hasScrapingRestrictions: boolean;
  statusCode?: number;
  contentType?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
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
          // Check robots.txt with proper error handling
          let hasScrapingRestrictions = false;
          
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
              hasScrapingRestrictions = robotsText.toLowerCase().includes('disallow: /');
              console.log(`Robots.txt found, has restrictions: ${hasScrapingRestrictions}`);
            }
          } catch (robotsError) {
            console.error('Error checking robots.txt:', robotsError);
            // If we can't check robots.txt, assume no restrictions but log the error
          }

          const result: URLAccessResponse = {
            isAccessible: true,
            hasScrapingRestrictions,
            statusCode,
            contentType
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
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
