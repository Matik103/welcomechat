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

async function giveAssistantAccess(documentId: string, assistantId: string): Promise<Response> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/give-assistant-access`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ document_id: documentId, assistant_id: assistantId })
  });

  return response;
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

    // Get document details and assistant_id
    const { data: doc, error: docError } = await supabase
      .from('assistant_documents')
      .select(`
        assistant_id,
        storage_url
      `)
      .eq('document_id', document_id)
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
      .from(DOCUMENTS_BUCKET)
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
        .from('document_contentdocument_content')
        .update({ content: extractedText })
        .eq('id', document_id);

      if (updateError) {
        throw updateError;
      }

      // Give assistant access to the processed document
      const accessResponse = await giveAssistantAccess(document_id, doc.assistant_id);
      
      if (!accessResponse.ok) {
        const errorData = await accessResponse.json();
        console.error('Failed to give assistant access:', errorData);
        // Continue despite this error, as the text extraction was successful
      }

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