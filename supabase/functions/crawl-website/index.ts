
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  try {
    const { websiteId, clientId, url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing website: ${url} for client: ${clientId}`);
    
    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // First try to fetch website content
    let content = '';
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SupabaseCrawlerBot/1.0)' },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      content = convertHtmlToMarkdown(html);
      
      console.log(`Successfully fetched and converted website content (${content.length} chars)`);
    } catch (fetchError) {
      console.error(`Error fetching website: ${fetchError.message}`);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'No content extracted from website' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Store the content in the ai_agents table
    const { data: aiAgentData, error: aiAgentError } = await supabase
      .from('ai_agents')
      .insert({
        client_id: clientId,
        name: `Website: ${url}`,
        content: content,
        interaction_type: 'website_content',
        metadata: {
          source_url: url,
          website_url_id: websiteId,
          imported_at: new Date().toISOString()
        }
      });
    
    if (aiAgentError) {
      console.error(`Error storing content in ai_agents: ${aiAgentError.message}`);
      throw aiAgentError;
    }

    // Get the client's OpenAI assistant ID
    const { data: assistantData, error: assistantError } = await supabase
      .from('ai_agents')
      .select('openai_assistant_id')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .maybeSingle();
    
    if (assistantError) {
      console.error(`Error getting assistant ID: ${assistantError.message}`);
      // Continue anyway, we already stored the content
    }
    
    const assistantId = assistantData?.openai_assistant_id;
    
    // If we have an assistant ID and OpenAI API key, update the assistant
    if (assistantId && OPENAI_API_KEY) {
      try {
        // Create a file with OpenAI
        const file = new File([content], `website-${websiteId}.md`, { type: 'text/markdown' });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('purpose', 'assistants');
        
        const openaiFileResponse = await fetch('https://api.openai.com/v1/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
        });
        
        if (!openaiFileResponse.ok) {
          const errorData = await openaiFileResponse.json();
          throw new Error(`OpenAI file upload error: ${JSON.stringify(errorData)}`);
        }
        
        const fileData = await openaiFileResponse.json();
        const fileId = fileData.id;
        
        // Attach the file to the assistant
        const attachResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_id: fileId,
          }),
        });
        
        if (!attachResponse.ok) {
          const errorData = await attachResponse.json();
          throw new Error(`OpenAI file attachment error: ${JSON.stringify(errorData)}`);
        }
        
        console.log(`Successfully attached website content to OpenAI assistant`);
      } catch (openaiError) {
        console.error(`Error updating OpenAI assistant: ${openaiError.message}`);
        // Continue anyway, we already stored the content locally
      }
    }
    
    // Update website_url status
    const { error: updateError } = await supabase
      .from('website_urls')
      .update({ 
        status: 'completed',
        last_crawled: new Date().toISOString()
      })
      .eq('id', websiteId);
    
    if (updateError) {
      console.error(`Error updating website URL status: ${updateError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Website processed successfully',
        content_length: content.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`Error processing website: ${error.message}`);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Basic HTML to Markdown converter
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
  const MAX_CONTENT_LENGTH = 100000; // ~100KB limit
  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.substring(0, MAX_CONTENT_LENGTH) + 
      '\n\n... Content truncated due to size limits ...\n';
  }

  return content;
}
