
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.2/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DriveAccessResponse {
  accessLevel: 'public' | 'private' | 'unknown';
  fileType: 'file' | 'folder' | 'unknown';
  error?: string;
}

const oauth2Client = new OAuth2Client({
  clientId: Deno.env.get('GOOGLE_CLIENT_ID') || '',
  clientSecret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
  authorizationEndpointUri: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUri: 'https://oauth2.googleapis.com/token',
  redirectUri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/check-drive-access/callback`,
  defaults: {
    scope: ['https://www.googleapis.com/auth/drive.readonly']
  }
});

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileId } = await req.json();

    if (!fileId) {
      return new Response(
        JSON.stringify({ error: 'File ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Make a request to the Google Drive API
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=capabilities(canView),mimeType`,
        {
          headers: {
            'Authorization': `Bearer ${oauth2Client.accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return new Response(
            JSON.stringify({ accessLevel: 'unknown', fileType: 'unknown', error: 'File not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (response.status === 403) {
          return new Response(
            JSON.stringify({ accessLevel: 'private', fileType: 'unknown', error: 'Access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const fileData = await response.json();
      const isPublic = fileData.capabilities?.canView === true;
      const mimeType = fileData.mimeType || '';

      const result: DriveAccessResponse = {
        accessLevel: isPublic ? 'public' : 'private',
        fileType: mimeType.includes('folder') ? 'folder' : 'file',
      };

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error checking Drive access:', error);
      return new Response(
        JSON.stringify({ 
          accessLevel: 'unknown', 
          fileType: 'unknown', 
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error parsing request:', error);
    return new Response(
      JSON.stringify({ 
        accessLevel: 'unknown', 
        fileType: 'unknown', 
        error: 'Invalid request format'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
