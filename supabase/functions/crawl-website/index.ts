
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CrawlOptions {
  limit?: number;
  maxDepth?: number;
  allowBackwardLinks?: boolean;
  allowExternalLinks?: boolean;
  scrapeOptions?: {
    formats?: string[];
    onlyMainContent?: boolean;
    includeTags?: string[];
    excludeTags?: string[];
    waitFor?: number;
    timeout?: number;
  };
}

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
    const { url, options } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }
    
    console.log(`Initiating crawl for URL: ${url}`);
    
    // Define default options
    const defaultOptions: CrawlOptions = {
      limit: 50,
      maxDepth: 3,
      allowBackwardLinks: true,
      allowExternalLinks: false,
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
        includeTags: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "article", "main", "section"],
        excludeTags: ["nav", "footer", "header", "aside", "script", "style", "button", ".cookie-banner", ".popup", ".modal", ".advertisement", ".social-share", ".newsletter-signup"],
        waitFor: 1000,
        timeout: 30000
      }
    };
    
    // Merge provided options with defaults
    const crawlOptions = {
      ...defaultOptions,
      ...options,
      scrapeOptions: {
        ...defaultOptions.scrapeOptions,
        ...options?.scrapeOptions
      }
    };
    
    // Start the crawl with Firecrawl API
    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url,
        limit: crawlOptions.limit,
        maxDepth: crawlOptions.maxDepth,
        allowBackwardLinks: crawlOptions.allowBackwardLinks,
        allowExternalLinks: crawlOptions.allowExternalLinks,
        scrapeOptions: crawlOptions.scrapeOptions
      })
    });
    
    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text();
      console.error(`Error from Firecrawl API: ${crawlResponse.status} - ${errorText}`);
      throw new Error(`Firecrawl API error: ${crawlResponse.status} - ${errorText}`);
    }
    
    const crawlResult = await crawlResponse.json();
    console.log('Crawl job initiated:', crawlResult);
    
    return new Response(
      JSON.stringify(crawlResult),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error in crawl-website edge function:', error);
    
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
