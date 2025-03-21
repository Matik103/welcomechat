
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
};

interface DriveAccessResponse {
  accessLevel: 'public' | 'private' | 'unknown';
  fileType: 'file' | 'folder' | 'unknown';
  isAccessible: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Received request data:", requestData);

    // Accept both fileId (old parameter) and url (new parameter)
    const fileId = requestData.fileId;
    const url = requestData.url || requestData.link;

    if (!fileId && !url) {
      return new Response(
        JSON.stringify({ 
          error: 'Either fileId or url is required',
          accessLevel: 'unknown',
          fileType: 'unknown',
          isAccessible: false
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Since OAuth integration has been removed, we'll provide a simplified validation
    // This version just checks if the URL seems to be a valid Drive/Docs URL
    if (url) {
      const isGoogleUrl = url.includes('drive.google.com') || 
                         url.includes('docs.google.com') || 
                         url.includes('sheets.google.com');
      
      const result: DriveAccessResponse = {
        accessLevel: 'public', // Optimistically assume it's public
        fileType: url.includes('folders') ? 'folder' : 'file',
        isAccessible: true
      };
      
      if (!isGoogleUrl) {
        result.accessLevel = 'unknown';
        result.isAccessible = false;
        result.error = 'URL does not appear to be a Google Drive link';
      }

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic response for fileId-based requests
    const result: DriveAccessResponse = {
      accessLevel: 'public',
      fileType: 'file',
      isAccessible: true
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing request:', error);
    return new Response(
      JSON.stringify({ 
        accessLevel: 'unknown', 
        fileType: 'unknown', 
        isAccessible: false,
        error: 'Invalid request format'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
