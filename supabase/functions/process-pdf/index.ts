
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
    const { client_id, document_id, file_name, file_type, pdf_data, page_number } = await req.json();
    console.log("Process PDF function called with params:", { client_id, document_id, file_type, file_name });

    if (!pdf_data) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Missing PDF data"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (file_type !== 'application/pdf') {
      console.warn(`Skipping extraction for non-PDF file: ${file_type}`);
      return new Response(
        JSON.stringify({
          status: "skipped",
          message: "Document is not a PDF file, skipping extraction",
          document_id: document_id,
          file_type: file_type
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log("PDF data received, sending to RapidAPI for extraction");
    
    // Extract base64 data from the data URL
    const base64Data = pdf_data.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
    
    // Create FormData and append the PDF file
    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), file_name || 'document.pdf');
    
    // Add optional page parameter if provided
    if (page_number) {
      formData.append('page', page_number.toString());
    }
    
    // Call RapidAPI PDF to Text converter with exact headers
    const response = await fetch(RAPIDAPI_URL, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RapidAPI error: ${response.status} ${errorText}`);
      
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

    // Process the API response
    const result = await response.json();
    console.log("Text extraction successful, response received");
    
    // Extract the text from the API response
    const extractedText = result.text || 
                          (typeof result === 'string' ? result : JSON.stringify(result));
    
    if (document_id) {
      // Update document record with the extracted text
      const { error: updateError } = await supabase
        .from('document_content')
        .update({ 
          content: extractedText,
          metadata: {
            processing_status: 'completed',
            extraction_method: 'rapidapi',
            extraction_completed: new Date().toISOString(),
            text_length: extractedText.length,
            processing_version: '1.0.9' // Updated version number
          }
        })
        .eq('document_id', document_id);
        
      if (updateError) {
        console.error("Failed to update document content:", updateError.message);
      }
    }

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Text extracted successfully",
        document_id: document_id,
        text: extractedText,
        text_length: extractedText.length,
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
