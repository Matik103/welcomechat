
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DriveAccessResponse {
  accessLevel: 'public' | 'private' | 'unknown';
  fileType: 'file' | 'folder' | 'unknown';
  error?: string;
}

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

    // Since OAuth integration has been removed, we'll provide a simpler implementation
    // that just indicates we can't check access anymore
    const result: DriveAccessResponse = {
      accessLevel: 'unknown',
      fileType: 'unknown',
      error: 'Google Drive access checking functionality has been removed',
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
        error: 'Invalid request format'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
