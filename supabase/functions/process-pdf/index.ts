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
const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
if (!RAPIDAPI_KEY) {
  throw new Error("RAPIDAPI_KEY environment variable is not set");
}
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
    
    // Create form data
    const form = new FormData();
    form.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), file_name || 'document.pdf');
    
    // Add optional page parameter if provided
    if (page_number) {
      form.append('page', page_number.toString());
    }
    
    // Log API call details for debugging
    console.log('Sending request to RapidAPI:', {
      url: RAPIDAPI_URL,
      fileSize: pdfBuffer.byteLength,
      fileName: file_name || 'document.pdf'
    });

    let response;
    try {
      response = await fetch(RAPIDAPI_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        },
        body: form
      });

      console.log('RapidAPI Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('RapidAPI Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        // Update document status with error details
        await supabase
          .from('document_content')
          .update({
            metadata: {
              processing_status: 'failed',
              error_details: {
                status: response.status,
                message: errorText,
                timestamp: new Date().toISOString()
              }
            }
          })
          .eq('id', document_id);

        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      let extractedText = '';
      const responseText = await response.text();

      try {
        // Try to parse as JSON first
        const jsonResponse = JSON.parse(responseText);
        extractedText = jsonResponse.text || jsonResponse.content || responseText;
      } catch {
        // If not JSON, use the raw text
        extractedText = responseText;
      }

      if (!extractedText) {
        throw new Error('No text content received from API');
      }

      console.log(`Successfully extracted ${extractedText.length} characters`);
      
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
      console.error('PDF Processing Error:', error instanceof Error ? error.stack : error);
      
      // Update document status with error
      await supabase
        .from('document_content')
        .update({
          metadata: {
            processing_status: 'failed',
            error_details: {
              message: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString()
            }
          }
        })
        .eq('id', document_id);

      throw error;
    }
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
