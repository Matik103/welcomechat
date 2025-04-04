import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import OpenAI from "https://esm.sh/openai@4.24.1";

// Get environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

// Create clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants
const DOCUMENTS_BUCKET = 'assistant_documents';
const SUPPORTED_TYPES = {
  'text/plain': { maxSize: 10 * 1024 * 1024 },
  'application/pdf': { maxSize: 20 * 1024 * 1024 },
};

interface RequestBody {
  client_id: string;
  assistant_id: string;
  file_data: string;
  file_name: string;
  file_type: string;
}

async function uploadToStorage(
  file: Uint8Array,
  fileName: string,
  assistantId: string,
  clientId: string
): Promise<string> {
  const timestamp = new Date().getTime();
  const filePath = `${clientId}/${assistantId}/${timestamp}_${fileName}`;
  
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, file, {
      contentType: 'application/octet-stream',
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;
  return filePath;
}

async function uploadToOpenAI(
  file: Uint8Array,
  fileName: string,
  contentType: string
): Promise<string> {
  const formData = new FormData();
  formData.append('purpose', 'assistants');
  formData.append('file', new Blob([file], { type: contentType }), fileName);

  const response = await fetch('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const { client_id, assistant_id, file_data, file_name, file_type }: RequestBody = await req.json();

    // Validate required fields
    if (!client_id || !assistant_id || !file_data || !file_name || !file_type) {
      throw new Error("Missing required fields");
    }

    // Validate file type
    if (!(file_type in SUPPORTED_TYPES)) {
      throw new Error(`Unsupported file type: ${file_type}`);
    }

    // Verify assistant ownership
    const { data: assistant, error: assistantError } = await supabase
      .from('client_assistants')
      .select('id')
      .eq('id', assistant_id)
      .eq('client_id', client_id)
      .single();

    if (assistantError || !assistant) {
      throw new Error("Assistant not found or access denied");
    }

    // Decode and process file
    const binaryString = atob(file_data);
    const fileBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      fileBytes[i] = binaryString.charCodeAt(i);
    }

    // Check file size
    if (fileBytes.length > SUPPORTED_TYPES[file_type].maxSize) {
      throw new Error(`File size exceeds maximum allowed size for ${file_type}`);
    }

    // Upload to storage
    const storagePath = await uploadToStorage(fileBytes, file_name, assistant_id, client_id);
    
    // Upload to OpenAI
    const openaiFileId = await uploadToOpenAI(fileBytes, file_name, file_type);

    // Associate file with OpenAI assistant
    await openai.beta.assistants.files.create(
      assistant_id,
      { file_id: openaiFileId }
    );

    // Get storage URL
    const { data: { publicUrl } } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(storagePath);

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('assistant_documents')
      .insert({
        assistant_id: assistant.id,
        filename: file_name,
        file_type: file_type,
        storage_path: storagePath,
        metadata: {
          size: fileBytes.length,
          openai_file_id: openaiFileId,
          storage_url: publicUrl,
          uploadedAt: new Date().toISOString()
        },
        status: file_type === 'application/pdf' ? 'pending_extraction' : 'ready'
      })
      .select()
      .single();

    if (docError) {
      throw new Error(`Failed to create document record: ${docError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        document: {
          id: document.id,
          filename: document.filename,
          status: document.status,
          storage_path: document.storage_path,
          openai_file_id: openaiFileId
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
}); 