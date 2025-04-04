import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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
    const { document_id, assistant_id } = await req.json();

    if (!document_id || !assistant_id) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Missing required fields: document_id and assistant_id are required"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get document status and content
    const { data: docStatus, error: docError } = await supabase
      .from('assistant_documents')
      .select(`
        status,
        document_content (
          id,
          content,
          file_type,
          filename,
          storage_url,
          metadata
        )
      `)
      .eq('assistant_id', assistant_id)
      .eq('document_id', document_id)
      .single();

    if (docError) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to fetch document status",
          details: docError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!docStatus) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Document not found"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Return status and content if available
    return new Response(
      JSON.stringify({
        status: "success",
        document_status: docStatus.status,
        document: {
          id: docStatus.document_content.id,
          content: docStatus.document_content.content,
          file_type: docStatus.document_content.file_type,
          filename: docStatus.document_content.filename,
          storage_url: docStatus.document_content.storage_url,
          metadata: docStatus.document_content.metadata
        }
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