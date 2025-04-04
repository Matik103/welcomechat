import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Get environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const PDF_PROCESSOR_URL = Deno.env.get("PDF_PROCESSOR_URL") || "http://localhost:3000";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  document_id?: string;
  storage_path?: string;
  chunk_size?: number;
  max_chunks?: number;
  continue_from?: number;
  create_if_not_exists?: boolean;
  client_id?: string;
}

async function createDocumentRecord(storage_path: string, client_id: string): Promise<any> {
  // Generate UUIDs for document_id and client_id if needed
  const document_id = crypto.randomUUID();
  const normalized_client_id = client_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i) ? 
    client_id : crypto.randomUUID();
  
  const { data, error } = await supabase
    .from('document_content')
    .insert({
      client_id: normalized_client_id,
      document_id,
      metadata: {
        storage_path,
        uploadedAt: new Date().toISOString(),
        processing_status: 'pending_extraction',
        original_client_id: client_id
      },
      content: null,
      filename: storage_path.split('/').pop() || '',
      file_type: 'pdf'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create document record: ${error.message}`);
  }

  return data;
}

async function getDocumentByStoragePath(storage_path: string): Promise<any> {
  const { data, error } = await supabase
    .from('document_content')
    .select('*')
    .eq('metadata->>storage_path', storage_path)
    .single();

  if (error) {
    throw new Error(`Document not found: ${error.message}`);
  }

  return data;
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
    const {
      document_id,
      storage_path,
      chunk_size,
      max_chunks,
      continue_from,
      create_if_not_exists = false,
      client_id
    } = await req.json() as RequestBody;

    if (!document_id && !storage_path) {
      throw new Error("Either document_id or storage_path must be provided");
    }

    if (create_if_not_exists && !client_id) {
      throw new Error("client_id is required when create_if_not_exists is true");
    }

    // Get document record
    let document;
    if (document_id) {
      const { data, error } = await supabase
        .from('document_content')
        .select('*')
        .eq('document_id', document_id)
        .single();

      if (error) {
        throw new Error(`Document not found: ${error.message}`);
      }
      document = data;
    } else if (storage_path) {
      try {
        document = await getDocumentByStoragePath(storage_path);
      } catch (error) {
        if (create_if_not_exists && client_id) {
          document = await createDocumentRecord(storage_path, client_id);
        } else {
          throw error;
        }
      }
    }

    // Forward request to PDF processing service
    const response = await fetch(`${PDF_PROCESSOR_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id: document.id,
        storage_path: document.metadata?.storage_path || storage_path,
        chunk_size,
        max_chunks,
        continue_from
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'PDF processing failed');
    }

    const result = await response.json();

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error in extract-pdf-content function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 