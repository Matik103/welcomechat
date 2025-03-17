/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ValidationResult {
  isAccessible: boolean;
  error?: string;
  details: {
    robotsTxtAllows: boolean;
    isSecure: boolean;
    contentType?: string;
  };
}

interface ValidationRequest {
  url: string;
  type: 'website' | 'google_drive';
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Parse request body
    const { url, type } = await req.json() as ValidationRequest;

    let result: ValidationResult;

    if (type === 'website') {
      result = await validateWebsiteUrl(url);
    } else if (type === 'google_drive') {
      result = await validateGoogleDriveUrl(url);
    } else {
      throw new Error('Invalid URL type');
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function validateWebsiteUrl(url: string): Promise<ValidationResult> {
  try {
    const urlObj = new URL(url);
    const result: ValidationResult = {
      isAccessible: true,
      details: {
        isSecure: urlObj.protocol === 'https:',
        robotsTxtAllows: true,
        contentType: undefined,
      },
    };

    // Check if URL is accessible
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Welcome.chat URL Validator',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
        },
        redirect: 'follow',
      });

      result.details.contentType = response.headers.get('content-type') || undefined;

      if (!response.ok) {
        result.isAccessible = false;
        result.error = `Server returned status ${response.status}`;
        return result;
      }

      // Check robots.txt
      try {
        const robotsTxtUrl = new URL('/robots.txt', urlObj.origin);
        const robotsTxtResponse = await fetch(robotsTxtUrl.toString());
        const robotsTxtContent = await robotsTxtResponse.text();
        result.details.robotsTxtAllows = !robotsTxtContent.includes('Disallow: /');
      } catch (robotsError) {
        console.error('Error checking robots.txt:', robotsError);
        // Don't fail validation if robots.txt check fails
        result.details.robotsTxtAllows = true;
      }
    } catch (fetchError) {
      result.isAccessible = false;
      result.error = fetchError instanceof Error ? fetchError.message : 'Failed to fetch URL';
    }

    return result;
  } catch (error) {
    return {
      isAccessible: false,
      error: error instanceof Error ? error.message : 'Invalid URL format',
      details: {
        isSecure: false,
        robotsTxtAllows: false,
      },
    };
  }
}

async function validateGoogleDriveUrl(url: string): Promise<ValidationResult> {
  try {
    const urlObj = new URL(url);
    const result: ValidationResult = {
      isAccessible: true,
      details: {
        isSecure: true, // Google Drive URLs are always HTTPS
        robotsTxtAllows: true,
        contentType: undefined,
      },
    };

    // Check if it's a valid Google Drive URL
    if (!urlObj.hostname.includes('drive.google.com')) {
      result.isAccessible = false;
      result.error = 'Not a valid Google Drive URL';
      return result;
    }

    // Extract resource ID and type
    let resourceId = '';
    let resourceType = 'file';
    
    if (url.includes('/file/d/')) {
      resourceId = url.split('/file/d/')[1].split('/')[0];
      resourceType = 'file';
    } else if (url.includes('/folders/')) {
      resourceId = url.split('/folders/')[1].split('/')[0];
      resourceType = 'folder';
    } else if (url.includes('id=')) {
      resourceId = new URLSearchParams(urlObj.search).get('id') || '';
      resourceType = url.includes('/folders/') ? 'folder' : 'file';
    }

    if (!resourceId) {
      result.isAccessible = false;
      result.error = 'Could not extract resource ID from URL';
      return result;
    }

    // Check if resource is accessible
    try {
      const response = await fetch(`https://drive.google.com/uc?export=view&id=${resourceId}`, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Welcome.chat URL Validator',
          'Accept': '*/*',
        },
      });

      result.details.contentType = response.headers.get('content-type') || undefined;

      if (!response.ok) {
        result.isAccessible = false;
        result.error = `${resourceType === 'folder' ? 'Folder' : 'File'} is not accessible (status ${response.status})`;
        return result;
      }

      // For files, check if content type is supported
      if (resourceType === 'file') {
        const supportedTypes = [
          'application/pdf',
          'text/plain',
          'text/html',
          'text/csv',
          'application/vnd.openxmlformats-officedocument',
          'application/vnd.google-apps',
        ];

        const contentType = result.details.contentType || '';
        if (!supportedTypes.some(type => contentType.includes(type))) {
          result.isAccessible = false;
          result.error = 'Unsupported file type';
        }
      }
    } catch (fetchError) {
      result.isAccessible = false;
      result.error = fetchError instanceof Error ? fetchError.message : 'Failed to check resource accessibility';
    }

    return result;
  } catch (error) {
    return {
      isAccessible: false,
      error: error instanceof Error ? error.message : 'Invalid URL format',
      details: {
        isSecure: true,
        robotsTxtAllows: false,
      },
    };
  }
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/validate-urls' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
