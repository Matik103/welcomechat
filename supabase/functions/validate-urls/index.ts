// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from Functions!")

interface ValidationRequest {
  url: string;
  type: 'website' | 'drive';
}

interface ValidationResponse {
  isAccessible: boolean;
  error?: string;
  details?: {
    statusCode?: number;
    contentType?: string;
    robotsTxtAllows?: boolean;
    isGoogleDriveViewable?: boolean;
    isSecure?: boolean;
    serverInfo?: {
      headers?: Record<string, string>;
      certificate?: {
        valid: boolean;
        expiryDate?: string;
      };
    };
  };
}

async function checkWebsiteAccessibility(url: string): Promise<ValidationResponse> {
  try {
    const urlObj = new URL(url);
    
    // Check if the URL uses HTTPS
    const isSecure = urlObj.protocol === 'https:';
    
    // First, check robots.txt
    const robotsTxtUrl = `${urlObj.protocol}//${urlObj.hostname}/robots.txt`;
    let robotsTxtAllows = true;
    
    try {
      const robotsTxtResponse = await fetch(robotsTxtUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WelcomeChatBot/1.0; +https://welcome.chat)'
        }
      });
      if (robotsTxtResponse.ok) {
        const robotsTxt = await robotsTxtResponse.text();
        // More comprehensive check for crawler rules
        const userAgentSections = robotsTxt.toLowerCase().split('user-agent:');
        const relevantSections = userAgentSections.filter(section => 
          section.includes('*') || section.includes('welcomechatbot')
        );
        
        robotsTxtAllows = !relevantSections.some(section => 
          section.includes('disallow: /') && !section.includes('allow: /')
        );
      }
    } catch {
      // If robots.txt doesn't exist or can't be fetched, assume it's allowed
      robotsTxtAllows = true;
    }

    // Now check the actual URL with a full GET request to verify content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WelcomeChatBot/1.0; +https://welcome.chat)'
      }
    });

    // Get relevant headers
    const headers = Object.fromEntries(response.headers.entries());
    const contentType = headers['content-type'];

    // Check if content type is supported (text/html, application/json, etc.)
    const isSupportedContentType = contentType && (
      contentType.includes('text/html') ||
      contentType.includes('application/json') ||
      contentType.includes('text/plain')
    );

    if (!isSupportedContentType) {
      return {
        isAccessible: false,
        error: `Unsupported content type: ${contentType}`,
        details: {
          statusCode: response.status,
          contentType,
          robotsTxtAllows,
          isSecure,
          serverInfo: { headers }
        }
      };
    }

    return {
      isAccessible: response.ok,
      details: {
        statusCode: response.status,
        contentType,
        robotsTxtAllows,
        isSecure,
        serverInfo: { headers }
      }
    };
  } catch (error) {
    return {
      isAccessible: false,
      error: error.message
    };
  }
}

async function checkGoogleDriveAccessibility(url: string): Promise<ValidationResponse> {
  try {
    // More comprehensive file ID extraction
    let fileId: string | undefined;
    
    if (url.includes('drive.google.com/file/d/')) {
      fileId = url.split('/file/d/')[1]?.split('/')[0];
    } else if (url.includes('drive.google.com/drive/folders/')) {
      fileId = url.split('/folders/')[1]?.split('/')[0];
    } else if (url.includes('docs.google.com')) {
      fileId = url.match(/\/d\/([-\w]{25,})/)?.[1];
    } else if (url.includes('id=')) {
      fileId = new URL(url).searchParams.get('id') || undefined;
    }

    if (!fileId) {
      return {
        isAccessible: false,
        error: 'Invalid Google Drive URL format'
      };
    }

    // Try multiple endpoints to verify access
    const endpoints = [
      `https://drive.google.com/uc?id=${fileId}`,
      `https://drive.google.com/file/d/${fileId}/view`,
      `https://drive.google.com/drive/folders/${fileId}`
    ];

    let isAccessible = false;
    let finalResponse: Response | undefined;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'HEAD',
          redirect: 'follow'
        });

        if (response.ok) {
          isAccessible = true;
          finalResponse = response;
          break;
        }
      } catch {
        continue;
      }
    }

    // Get headers if available
    const headers = finalResponse ? Object.fromEntries(finalResponse.headers.entries()) : {};

    return {
      isAccessible,
      details: {
        statusCode: finalResponse?.status,
        isGoogleDriveViewable: isAccessible,
        serverInfo: { headers }
      }
    };
  } catch (error) {
    return {
      isAccessible: false,
      error: error.message
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the JWT token
    const jwt = authHeader.replace('Bearer ', '');

    // Create a Supabase client to verify the token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verify the JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url, type } = await req.json() as ValidationRequest;

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
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: ValidationResponse;

    if (type === 'drive') {
      if (!url.includes('drive.google.com') && !url.includes('docs.google.com')) {
        return new Response(
          JSON.stringify({ error: 'Not a valid Google Drive URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      result = await checkGoogleDriveAccessibility(url);
    } else {
      result = await checkWebsiteAccessibility(url);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-urls function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/validate-urls' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
