
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
    const { document_id, client_id, file_path, file_type, filename } = await req.json();
    console.log("Process PDF function called with params:", { document_id, client_id, file_type });

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

    // Get document details if they weren't provided
    let docFileType = file_type;
    let docFilename = filename;
    let storagePath = file_path;
    
    if (!docFileType || !docFilename || !storagePath) {
      console.log("Some document details missing, fetching from database");
      
      const { data: docData, error: docError } = await supabase
        .from('document_content')
        .select('metadata, filename, file_type')
        .eq('id', document_id)
        .single();
        
      if (docError) {
        console.error("Failed to get document details:", docError.message);
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Failed to get document details",
            details: docError.message
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
      
      docFileType = docFileType || docData?.file_type;
      docFilename = docFilename || docData?.filename;
      storagePath = storagePath || docData?.metadata?.storage_path || docData?.metadata?.upload_path;
      
      console.log("Retrieved document details:", { 
        docFileType, 
        docFilename,
        storagePath
      });
    }

    // Update document status to indicate it's queued for processing
    const { error: updateError } = await supabase
      .from('document_content')
      .update({
        metadata: {
          processing_status: 'queued_for_extraction',
          last_updated: new Date().toISOString(),
          extraction_method: 'rapidapi',
          queue_timestamp: new Date().toISOString(),
          processing_version: '1.0.2',
          storage_path: storagePath
        }
      })
      .eq('id', document_id);

    if (updateError) {
      console.error("Failed to update document status:", updateError.message);
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

    // Only process PDFs
    if (docFileType !== 'application/pdf') {
      console.warn(`Skipping extraction for non-PDF file: ${docFileType}`);
      return new Response(
        JSON.stringify({
          status: "skipped",
          message: "Document is not a PDF file, skipping extraction",
          document_id: document_id,
          file_type: docFileType
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Invoke the actual PDF text extraction function
    console.log(`Invoking extract-pdf-text for document ${document_id}`);
    const { data: extractionData, error: extractionError } = await supabase.functions.invoke(
      'extract-pdf-text',
      {
        body: { 
          document_id,
          storage_path: storagePath
        }
      }
    );

    if (extractionError) {
      console.error(`Error invoking text extraction for document ${document_id}:`, extractionError);
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

    console.log(`Successfully queued document ${document_id} for processing`);
    return new Response(
      JSON.stringify({
        status: "success",
        message: "Document queued for processing",
        document_id: document_id,
        extraction_details: extractionData,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Unexpected error in process-pdf function:", error);
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
