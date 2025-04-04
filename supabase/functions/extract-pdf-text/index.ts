import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to extract text from PDF buffer
function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const textDecoder = new TextDecoder('utf-8');
  const content = textDecoder.decode(uint8Array);
  
  let extractedText = '';
  
  // Split content into objects
  const objects = content.split(/\d+ 0 obj/);
  
  for (const obj of objects) {
    // Look for text content markers
    if (obj.includes('/Type/Page') || obj.includes('/Type /Page')) {
      // Extract text between parentheses, angle brackets, and square brackets
      const matches = obj.match(/[<(\[]([^>)\]]+)[>)\]]/g) || [];
      for (const match of matches) {
        // Clean up the text
        const text = match.slice(1, -1)
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\\\/g, '\\')
          .replace(/\\/g, '')
          .replace(/[^a-zA-Z0-9\s.,!?-]/g, ' ')
          .trim();
        
        if (text && !/^\d+$/.test(text) && text.length > 1) {
          extractedText += text + ' ';
        }
      }
    }
  }
  
  // Clean up the final text
  extractedText = extractedText
    .replace(/\s+/g, ' ')
    .trim();
  
  return extractedText || 'No text content could be extracted from this PDF.';
}

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

    // Get document details
    const { data: doc, error: docError } = await supabase
      .from('document_content')
      .select('storage_url')
      .eq('id', document_id)
      .single();

    if (docError || !doc) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to fetch document",
          details: docError?.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Download PDF from storage
    const storagePath = doc.storage_url.split('public/documents/')[1];
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (downloadError) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to download PDF",
          details: downloadError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Extract text from PDF
    try {
      const buffer = await pdfData.arrayBuffer();
      const extractedText = extractTextFromPdfBuffer(buffer);

      // Update document content
      const { error: updateError } = await supabase
        .from('document_content')
        .update({ content: extractedText })
        .eq('id', document_id);

      if (updateError) {
        throw updateError;
      }

      // Update assistant_documents status
      await supabase
        .from('assistant_documents')
        .update({ status: 'ready' })
        .eq('document_id', document_id);

      return new Response(
        JSON.stringify({
          status: "success",
          message: "Text extracted successfully",
          document_id: document_id,
          preview: extractedText.substring(0, 100) + '...'
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );

    } catch (error) {
      // Update assistant_documents status to error
      await supabase
        .from('assistant_documents')
        .update({ status: 'error' })
        .eq('document_id', document_id);

      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to extract text",
          details: error.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

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