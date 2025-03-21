
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get the Firecrawl API key from environment variables
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY environment variable is not set');
    }
    
    // Parse the request body
    const { url, options = {} } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }
    
    console.log(`Scraping URL: ${url}`);
    
    // Define the formats to include
    const formats = options.formats || ['markdown', 'html'];
    
    // Prepare scrape options
    const scrapeOptions = {
      formats,
      onlyMainContent: options.onlyMainContent !== undefined ? options.onlyMainContent : true,
      includeTags: options.includeTags || ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "article", "main", "section"],
      excludeTags: options.excludeTags || ["nav", "footer", "header", "aside", "script", "style", "button", ".cookie-banner", ".popup", ".modal", ".advertisement", ".social-share", ".newsletter-signup"],
      waitFor: options.waitFor || 1000,
      timeout: options.timeout || 30000
    };
    
    // Call the Firecrawl API to scrape the URL
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url,
        formats,
        pageOptions: {
          onlyMainContent: scrapeOptions.onlyMainContent,
          includeTags: scrapeOptions.includeTags,
          excludeTags: scrapeOptions.excludeTags,
          waitFor: scrapeOptions.waitFor,
          timeout: scrapeOptions.timeout
        },
        ...(options.actions ? { actions: options.actions } : {})
      })
    });
    
    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error(`Error from Firecrawl API: ${scrapeResponse.status} - ${errorText}`);
      throw new Error(`Firecrawl API error: ${scrapeResponse.status} - ${errorText}`);
    }
    
    const scrapeResult = await scrapeResponse.json();
    console.log('Scrape completed successfully');
    
    return new Response(
      JSON.stringify(scrapeResult),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error in scrape-url edge function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
