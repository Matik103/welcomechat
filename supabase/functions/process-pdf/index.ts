import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  try {
    const decoder = new TextDecoder('utf-8');
    const content = decoder.decode(buffer);
    
    // Extract text content using PDF structure markers
    let extractedText = '';
    const textObjects = content.match(/BT[\s\S]*?ET/g) || [];
    
    for (const textObj of textObjects) {
      // Extract text between parentheses and angle brackets
      const textMatches = textObj.match(/[(\[<]([^)\]>]+)[)\]>]/g) || [];
      for (const match of textMatches) {
        const text = match.slice(1, -1)
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\\\/g, '\\')
          .replace(/\\[()]/g, '')
          .replace(/[^a-zA-Z0-9\s.,!?-]/g, ' ')
          .trim();
        
        if (text && !/^\d+$/.test(text) && text.length > 1) {
          extractedText += text + ' ';
        }
      }
    }
    
    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .trim();
    
    return extractedText || 'No text content could be extracted from this PDF.';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
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
      const extractedText = await extractTextFromPdf(buffer);

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