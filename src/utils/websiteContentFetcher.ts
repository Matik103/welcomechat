
import { supabase } from "@/integrations/supabase/client";
import { EDGE_FUNCTIONS_URL } from "@/config/env";

// Cache for recent website content to avoid duplicate fetches
const contentCache = new Map<string, {
  content: string;
  timestamp: number;
  success: boolean;
  error?: string;
}>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Fetches website content as markdown with caching
 */
export async function fetchWebsiteContent(url: string): Promise<{
  content: string;
  success: boolean;
  error?: string;
}> {
  // Check cache first
  const cachedResult = contentCache.get(url);
  if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_EXPIRATION_MS) {
    console.log("Using cached content for URL:", url);
    return {
      content: cachedResult.content,
      success: cachedResult.success,
      error: cachedResult.error
    };
  }

  try {
    console.log("Fetching content for URL:", url);
    
    // First try to use a dedicated Edge Function if available
    try {
      // Get auth session token for the edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        console.warn("No access token available for Edge Function");
      }
      
      const response = await fetch(`${EDGE_FUNCTIONS_URL}/fetch-website-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ url }),
        // Add a timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.content) {
          console.log("Successfully fetched website content from Edge Function");
          
          // Cache the result
          contentCache.set(url, {
            content: data.content,
            timestamp: Date.now(),
            success: true
          });
          
          return {
            content: data.content,
            success: true
          };
        } else {
          console.warn("Edge Function returned an error:", data.error || "Unknown error");
        }
      } else {
        console.warn(`Edge Function returned status: ${response.status}`);
      }
      
      console.log("Edge Function not available or failed, falling back to direct fetch");
    } catch (edgeFuncError) {
      console.warn("Edge Function error, falling back to direct fetch:", edgeFuncError);
    }

    // Fallback: direct fetch (note: this will only work for CORS-enabled sites)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const response = await fetch(url, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch website with status: ${response.status}`);
      }

      const htmlContent = await response.text();
      
      // Basic HTML to markdown conversion
      const markdownContent = convertHtmlToMarkdown(htmlContent);
      
      // Cache the result
      contentCache.set(url, {
        content: markdownContent,
        timestamp: Date.now(),
        success: true
      });
      
      return {
        content: markdownContent,
        success: true
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching website content:", error);
    
    // Cache the error result
    contentCache.set(url, {
      content: "",
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
    
    return {
      content: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Very basic HTML to Markdown converter
 * For production, consider using a library like Turndown
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
  const MAX_CONTENT_LENGTH = 50000; // Reduced from 100KB to 50KB for better performance
  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.substring(0, MAX_CONTENT_LENGTH) + 
      '\n\n... Content truncated due to size limits ...\n';
  }

  return content;
}
