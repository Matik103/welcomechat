import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import OpenAI from "https://esm.sh/openai@4.28.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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
    const { document_id, assistant_id, query } = await req.json();

    if (!document_id || !assistant_id || !query) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Missing required fields: document_id, assistant_id, and query are required"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get document content
    const { data: docStatus, error: docError } = await supabase
      .from('assistant_documents')
      .select(`
        status,
        document_content (
          content,
          file_type,
          filename
        )
      `)
      .eq('assistant_id', assistant_id)
      .eq('document_id', document_id)
      .single();

    if (docError || !docStatus) {
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

    if (docStatus.status !== 'ready') {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Document is not ready for querying",
          current_status: docStatus.status
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Query OpenAI
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant helping to analyze document content. The document is of type ${docStatus.document_content.file_type} named "${docStatus.document_content.filename}". Please provide accurate and relevant information based on the document content.`
          },
          {
            role: "user",
            content: `Document content: "${docStatus.document_content.content}"\n\nQuery: ${query}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return new Response(
        JSON.stringify({
          status: "success",
          response: completion.choices[0].message.content,
          document_id: document_id,
          query: query
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
          message: "Failed to query OpenAI",
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