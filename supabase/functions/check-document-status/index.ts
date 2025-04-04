import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface RequestBody {
  document_id: string | number;
  assistant_id: string;
}

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
    const { document_id, assistant_id } = await req.json() as RequestBody;

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

    // Get document content and assistant status
    const { data: docStatus, error: docError } = await supabase
      .from('assistant_documents')
      .select(`
        status,
        document_content!inner (
          id,
          document_id,
          content,
          file_type,
          filename
        )
      `)
      .eq('assistant_id', assistant_id)
      .eq('document_content.id', parseInt(document_id))
      .maybeSingle();

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

    // Get document details if not found in assistant_documents
    if (!docStatus) {
      const { data: document, error: documentError } = await supabase
        .from('document_content')
        .select('*')
        .eq('id', parseInt(document_id))
        .single();

      if (documentError || !document) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Document not found",
            details: documentError?.message
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          }
        );
      }

      return new Response(
        JSON.stringify({
          status: "success",
          document_status: "pending",
          message: "Document exists but not yet associated with assistant",
          document: {
            id: document.id,
            document_id: document.document_id,
            content: document.content,
            file_type: document.file_type,
            filename: document.filename
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "success",
        document_status: docStatus.status,
        message: `Document status is ${docStatus.status}`,
        document: {
          id: docStatus.document_content.id,
          document_id: docStatus.document_content.document_id,
          content: docStatus.document_content.content,
          file_type: docStatus.document_content.file_type,
          filename: docStatus.document_content.filename
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
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 