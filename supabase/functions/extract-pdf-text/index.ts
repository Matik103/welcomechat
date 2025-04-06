
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
const PDF_PROCESSOR_URL = Deno.env.get("PDF_PROCESSOR_URL") || "http://localhost:3000";

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
    console.log("Extract PDF text function called for document_id:", document_id);

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
    
    // Get document details
    const { data: docData, error: docError } = await supabase
      .from('document_content')
      .select('metadata, filename, file_type')
      .eq('id', document_id)
      .single();

    if (docError || !docData) {
      console.error("Failed to get document details:", docError?.message || "Document not found");
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to get document details",
          details: docError?.message || "Document not found"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    console.log("Document details retrieved:", {
      filename: docData.filename,
      fileType: docData.file_type,
      metadataKeys: docData.metadata ? Object.keys(docData.metadata) : "none"
    });
    
    // Check if it's a PDF
    if (docData.file_type !== 'application/pdf') {
      console.warn("Document is not a PDF, skipping extraction");
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Document is not a PDF file",
          details: `File type is ${docData.file_type}`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    const storagePath = docData.metadata?.storage_path;
    
    if (!storagePath) {
      console.error("Document has no storage path in metadata");
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Document has no storage path in metadata"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    console.log("Storage path found:", storagePath);
    
    // Update document_content status to indicate pending extraction
    const { error: updateError } = await supabase
      .from('document_content')
      .update({ 
        metadata: { 
          ...docData.metadata,
          processing_status: 'awaiting_extraction',
          updated_at: new Date().toISOString()
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

    // Also update assistant_documents status if applicable
    await supabase
      .from('assistant_documents')
      .update({ status: 'processing' })
      .eq('document_id', document_id);

    try {
      console.log("Calling PDF processing service at:", PDF_PROCESSOR_URL);
      // Call the PDF processing service
      const response = await fetch(`${PDF_PROCESSOR_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_id, storage_path: storagePath }),
      });

      console.log("PDF processor response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`PDF processing service error: ${response.status} ${errorText}`);
        throw new Error(`PDF processing service returned status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("PDF processor result:", JSON.stringify(result).substring(0, 200) + "...");
      
      return new Response(
        JSON.stringify({
          status: "success",
          message: "Document sent for processing with RapidAPI text extraction",
          document_id: document_id,
          processing_details: result
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (processingError) {
      console.error("Processing error:", processingError.message);
      
      // Update document status to indicate extraction failed
      await supabase
        .from('document_content')
        .update({ 
          metadata: { 
            ...docData.metadata,
            processing_status: 'extraction_failed',
            extraction_error: processingError.message,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', document_id);
        
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to process document with PDF processing service",
          details: processingError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

  } catch (error) {
    console.error("Unexpected error:", error.message);
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
