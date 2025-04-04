// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  url: string;
  agent_id: string;
}

async function downloadFromGoogleDrive(url: string): Promise<{ content: string; mimeType: string }> {
  console.log('Downloading from Google Drive URL:', url);

  // Extract file ID from various Google Drive URL formats
  let fileId = '';
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'docs.google.com') {
      const pathParts = urlObj.pathname.split('/');
      const docIndex = pathParts.indexOf('d');
      if (docIndex !== -1 && docIndex + 1 < pathParts.length) {
        const possibleFileId = pathParts[docIndex + 1];
        if (possibleFileId) {
          fileId = possibleFileId;
        }
      }
    }
  } catch (err) {
    console.error('Error parsing URL:', err);
    throw new Error('Invalid Google Drive URL');
  }

  if (!fileId) {
    throw new Error('Could not extract file ID from URL');
  }

  console.log('Extracted file ID:', fileId);

  // Get service account credentials from environment variable
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountKey) {
    throw new Error('Missing Google service account key');
  }

  try {
    // Get access token using service account
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: serviceAccountKey,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

    // Download the file using the Google Drive API
    const driveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!driveResponse.ok) {
      console.error('Download failed:', driveResponse.status, driveResponse.statusText);
      const responseText = await driveResponse.text();
      console.error('Response body:', responseText);
      throw new Error(`Failed to download file: ${driveResponse.statusText}`);
    }

    const content = await driveResponse.text();
    console.log('Downloaded content length:', content.length);
    if (content.length === 0) {
      throw new Error('Downloaded content is empty');
    }

    return { content, mimeType: 'text/plain' };
  } catch (err) {
    console.error('Error downloading file:', err);
    throw err;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Request body:', body);

    const { url, agent_id } = body as RequestBody;
    console.log('Received request:', { url, agent_id });

    if (!url || !agent_id) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Missing Supabase environment variables');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      { auth: { persistSession: false } }
    );

    // Download file from Google Drive
    const { content, mimeType } = await downloadFromGoogleDrive(url);

    // Create a blob from the content
    const blob = new Blob([content], { type: mimeType });
    console.log('Created blob size:', blob.size);

    // Upload to storage bucket
    const timestamp = Date.now();
    const filePath = `${agent_id}/documents/${timestamp}_gdoc.txt`;
    console.log('Uploading to path:', filePath);

    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('document-storage')
      .upload(filePath, blob);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('document-storage')
      .getPublicUrl(filePath);

    // Store document metadata
    const { data: docData, error: docError } = await supabaseClient
      .from('ai_documents')
      .insert([
        {
          agent_id,
          source_url: url,
          file_path: filePath,
          public_url: publicUrl,
          content_type: mimeType,
        }
      ])
      .select()
      .single();

    if (docError) {
      console.error('Database error:', docError);
      throw docError;
    }

    console.log('Document metadata stored:', docData);

    return new Response(
      JSON.stringify({ success: true, document: docData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});