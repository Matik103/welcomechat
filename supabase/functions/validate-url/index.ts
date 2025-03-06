
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidateUrlRequest {
  url: string;
  type: 'website' | 'drive';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, type } = await req.json() as ValidateUrlRequest;
    console.log(`Validating ${type} URL: ${url}`);

    // Basic URL format validation
    let isValidFormat = false;
    let formattedUrl = url;

    // Ensure URL starts with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = 'https://' + url;
    }

    try {
      new URL(formattedUrl);
      isValidFormat = true;
    } catch (e) {
      console.error(`URL format is invalid: ${e.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid URL format', 
          details: e.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If it's a Google Drive URL, validate the format
    if (type === 'drive') {
      const isDriveUrl = /drive\.google\.com|docs\.google\.com/.test(formattedUrl);
      
      if (!isDriveUrl) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Not a valid Google Drive URL' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Test if the drive URL is publicly accessible
      // This is a simplified check - in production, you'd want to attempt to access the file
      try {
        const response = await fetch(formattedUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (response.status === 200) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Google Drive URL is valid and accessible',
              url: formattedUrl
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.error(`Drive URL access failed with status: ${response.status}`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Google Drive URL is not publicly accessible', 
              details: `HTTP status: ${response.status}` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (e) {
        console.error(`Error checking Drive URL: ${e.message}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Error accessing Google Drive URL', 
            details: e.message 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } 
    
    // For website URLs, check if they're accessible and crawlable
    if (type === 'website') {
      try {
        // Check if website is accessible
        const response = await fetch(formattedUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (response.status !== 200) {
          console.error(`Website URL access failed with status: ${response.status}`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Website is not accessible', 
              details: `HTTP status: ${response.status}` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check for robots.txt to see if crawling is allowed
        const robotsUrl = new URL('/robots.txt', formattedUrl).toString();
        const robotsResponse = await fetch(robotsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        let crawlable = true;
        
        // If robots.txt exists and is accessible, check if crawling is disallowed
        if (robotsResponse.status === 200) {
          const robotsTxt = await robotsResponse.text();
          // Very simplified robots.txt check - in production, use a proper parser
          if (robotsTxt.includes('Disallow: /') || robotsTxt.includes('User-agent: * Disallow:')) {
            console.log('Robots.txt suggests crawling may be restricted');
            crawlable = false;
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            crawlable,
            message: crawlable ? 
              'Website URL is valid and crawlable' : 
              'Website URL is valid but crawling may be restricted',
            url: formattedUrl
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error(`Error checking website URL: ${e.message}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Error accessing website URL', 
            details: e.message 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Should never reach here but just in case
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid request type' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error processing request', 
        details: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
