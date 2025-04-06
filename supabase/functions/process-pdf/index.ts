
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
    const pdfBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Create FormData with the PDF file
    const formData = new FormData();
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('file', blob, file_name || 'document.pdf');
    
    // Add optional page parameter if provided
    if (page_number) {
      formData.append('page', page_number.toString());
    }
    
    // Log API call details for debugging
    console.log(`Calling RapidAPI with URL: ${RAPIDAPI_URL}`);
    console.log(`Using API key: ${RAPIDAPI_KEY.substring(0, 5)}...`);
    console.log(`Using host: ${RAPIDAPI_HOST}`);
    
    // Call RapidAPI PDF to Text converter
    const response = await fetch(RAPIDAPI_URL, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        // Let the browser set content-type with boundary
      },
      body: formData,
    });

    console.log(`RapidAPI response status: ${response.status}`);
    
    // Log response headers for debugging
    console.log("Response headers:");
    for (const [key, value] of response.headers.entries()) {
      console.log(`${key}: ${value}`);
    }

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

    let extractedText = '';
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Process JSON response
      const jsonData = await response.json();
      console.log("Raw API JSON response:", JSON.stringify(jsonData).substring(0, 200) + "...");
      
      extractedText = jsonData.text || '';
    } else {
      // Assume it's plain text
      extractedText = await response.text();
      console.log("Raw API text response:", extractedText.substring(0, 200) + "...");
    }
    
    console.log(`Extracted text length: ${extractedText.length}`);
    console.log(`Text sample: ${extractedText.substring(0, 100)}...`);
    
    if (document_id && extractedText) {
      console.log(`Updating document content for document_id: ${document_id}`);
      
      // Update document record with the extracted text
      const { data: updateData, error: updateError } = await supabase
        .from('document_content')
        .update({ 
          content: extractedText,
          metadata: {
            processing_status: 'completed',
            extraction_method: 'rapidapi',
            extraction_completed: new Date().toISOString(),
            text_length: extractedText.length,
            processing_version: '1.2.0' // Updated version number
          }
        })
        .eq('document_id', document_id);
        
      if (updateError) {
        console.error("Failed to update document content:", updateError.message);
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Failed to store extracted text",
            details: updateError.message
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
      
      console.log("Document content updated successfully");
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
