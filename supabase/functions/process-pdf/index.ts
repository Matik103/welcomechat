
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Type declarations for Deno environment
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const DOCUMENTS_BUCKET = 'client_documents';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const { document_id } = await req.json();

    if (!document_id) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Missing required field: document_id"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Update document status to indicate it's queued for processing
    const { error: updateError } = await supabase
      .from('document_content')
      .update({
        status: 'processing',
        metadata: {
          processing_status: 'queued_for_extraction',
          last_updated: new Date().toISOString(),
          extraction_method: 'rapidapi'
        }
      })
      .eq('id', document_id);

    if (updateError) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to update document status",
          details: updateError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Invoke the actual PDF text extraction function
    const { data: extractionData, error: extractionError } = await supabase.functions.invoke(
      'extract-pdf-text',
      {
        body: { document_id }
      }
    );

    if (extractionError) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to invoke text extraction",
          details: extractionError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Document queued for processing",
        document_id: document_id,
        extraction_details: extractionData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "An unexpected error occurred",
        details: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
