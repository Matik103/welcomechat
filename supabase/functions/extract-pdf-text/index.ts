
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
const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY") || "109e60ef56msh033c6355bf5052cp149673jsnec27c0641c4d";
const RAPIDAPI_HOST = "pdf-to-text-converter.p.rapidapi.com";
const RAPIDAPI_URL = "https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert";

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
    const { document_id, storage_path } = await req.json();
    console.log("Extract PDF text function called with params:", { document_id, storage_path });

    if (!document_id || !storage_path) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Missing required fields: document_id and storage_path"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Update document status to indicate extraction is in progress
    const { data: docData, error: updateError } = await supabase
      .from('document_content')
      .update({ 
        metadata: { 
          processing_status: 'extracting_text',
          extraction_started: new Date().toISOString(),
          storage_path: storage_path
        }
      })
      .eq('id', document_id)
      .select('filename, file_type')
      .single();

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

    // Verify file type is PDF
    if (docData?.file_type !== 'application/pdf') {
      console.warn(`Document is not a PDF: ${docData?.file_type}`);
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Document is not a PDF file",
          details: `File type is ${docData?.file_type}`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Download PDF directly from Supabase storage
    console.log("Downloading PDF from storage:", storage_path);
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .download(storage_path);

    if (downloadError || !pdfData) {
      console.error("Failed to download PDF:", downloadError?.message || "No data received");
      
      await supabase
        .from('document_content')
        .update({ 
          metadata: { 
            processing_status: 'extraction_failed',
            extraction_error: `Download failed: ${downloadError?.message || "No data received"}`,
            extraction_completed: new Date().toISOString()
          }
        })
        .eq('id', document_id);
      
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to download PDF from storage",
          details: downloadError?.message || "No data received"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Convert PDF to array buffer for FormData
    const pdfBuffer = await pdfData.arrayBuffer();
    
    // Create FormData and append the PDF file
    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 
      docData?.filename || 'document.pdf');
    
    console.log("Sending PDF directly to RapidAPI for text extraction");
    
    // Call RapidAPI PDF to Text converter
    const response = await fetch(RAPIDAPI_URL, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RapidAPI error: ${response.status} ${errorText}`);
      
      await supabase
        .from('document_content')
        .update({ 
          metadata: { 
            processing_status: 'extraction_failed',
            extraction_error: `API returned status ${response.status}: ${errorText}`,
            extraction_completed: new Date().toISOString()
          }
        })
        .eq('id', document_id);
        
      return new Response(
        JSON.stringify({
          status: "error",
          message: "PDF text extraction API error",
          details: `API returned status ${response.status}: ${errorText}`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status,
        }
      );
    }

    const result = await response.json();
    console.log("Text extraction successful, response received:", JSON.stringify(result).substring(0, 200) + "...");
    
    // Extract the text from the API response
    const extractedText = result.text || 
                          (typeof result === 'string' ? result : JSON.stringify(result));
    
    // Store the extracted text in the database
    const { error: contentUpdateError } = await supabase
      .from('document_content')
      .update({ 
        content: extractedText,
        metadata: {
          processing_status: 'completed',
          extraction_method: 'rapidapi',
          extraction_completed: new Date().toISOString(),
          text_length: extractedText.length
        }
      })
      .eq('id', document_id);
      
    if (contentUpdateError) {
      console.error("Failed to update document content:", contentUpdateError.message);
      
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to save extracted text",
          details: contentUpdateError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Update assistant_documents status if applicable
    await supabase
      .from('assistant_documents')
      .update({ status: 'ready' })
      .eq('document_id', document_id);

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Text extracted and stored successfully",
        document_id: document_id,
        text_length: extractedText.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
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
