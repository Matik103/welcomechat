import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface URLAccessResponse {
  isAccessible: boolean;
  hasScrapingRestrictions: boolean;
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
        JSON.stringify({ isAccessible: false, hasScrapingRestrictions: true, error: 'Invalid URL format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check URL accessibility with retries
    const maxRetries = 3;
    let lastError: string | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WelcomeChatBot/1.0; +https://welcomechat.ai)'
          },
        });

        if (response.ok) {
          // Check robots.txt with proper error handling
          try {
            const urlObj = new URL(url);
            const robotsUrl = `${urlObj.protocol}//${urlObj.hostname}/robots.txt`;
            const robotsResponse = await fetch(robotsUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; WelcomeChatBot/1.0; +https://welcomechat.ai)'
              },
            });

            if (robotsResponse.ok) {
              const robotsText = await robotsResponse.text();
              const hasScrapingRestrictions = robotsText.toLowerCase().includes('disallow: /');

              const result: URLAccessResponse = {
                isAccessible: true,
                hasScrapingRestrictions
              };

              return new Response(
                JSON.stringify(result),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } catch (robotsError) {
            console.error('Error checking robots.txt:', robotsError);
            // If we can't check robots.txt, assume no restrictions but log the error
            return new Response(
              JSON.stringify({ isAccessible: true, hasScrapingRestrictions: false }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        lastError = `HTTP ${response.status}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    // If we get here, all retries failed
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