
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // Reduced to 5MB from 10MB
const REQUEST_TIMEOUT_MS = 25000; // 25 seconds timeout

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Parse request body
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'URL is required' 
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 400,
        }
      );
    }

    console.log(`Fetching content for URL: ${url}`);
    
    // Create a controller to implement timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Request timed out'), REQUEST_TIMEOUT_MS);
    
    try {
      // Fetch the website content with timeout
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SupabaseFetchBot/1.0)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }

      // Get content type to check if it's HTML
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Not an HTML page: ${contentType}` 
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
            status: 400,
          }
        );
      }
      
      // Get content length
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      if (contentLength > MAX_CONTENT_SIZE) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Content too large: ${contentLength} bytes (max: ${MAX_CONTENT_SIZE} bytes)` 
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
            status: 400,
          }
        );
      }
      
      // Get the HTML content
      const html = await response.text();
      
      // Convert HTML to markdown
      const markdown = convertHtmlToMarkdown(html);
      
      // Return the processed content
      return new Response(
        JSON.stringify({
          success: true,
          content: markdown,
          url,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error processing website:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unknown error occurred',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});

/**
 * Basic HTML to Markdown converter - optimized for performance
 */
function convertHtmlToMarkdown(html: string): string {
  // Extract content from body tag
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  let content = bodyContent
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and their content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Convert headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    // Convert paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // Convert breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert strong/bold
    .replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, '**$2**')
    // Convert emphasis/italic
    .replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, '*$2*')
    // Convert links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Convert lists
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1\n')
    // Remove other HTML tags
    .replace(/<[^>]*>/g, '')
    // Fix multiple consecutive newlines
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up extra whitespace
  content = content.trim();
  
  // If content is too long, truncate it
  const MAX_CONTENT_LENGTH = 50000; // Reduced to 50KB from 100KB for better performance
  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.substring(0, MAX_CONTENT_LENGTH) + 
      '\n\n... Content truncated due to size limits ...\n';
  }

  return content;
}

// Add a listener for shutdown to handle any cleanup
addEventListener('beforeunload', () => {
  console.log('Function shutting down');
});
