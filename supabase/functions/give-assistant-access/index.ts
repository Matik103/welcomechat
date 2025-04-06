
/// <reference types="@types/node" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface RequestBody {
  document_id: string;
  assistant_id: string;
  client_id: string;
}

// Get environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Parse request body
    const { document_id, assistant_id, client_id } = await req.json() as RequestBody;

    // Validate required fields
    if (!document_id || !assistant_id || !client_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: document_id, assistant_id, and client_id are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Parse document_id as a number
    const numericDocId = parseInt(document_id, 10);
    if (isNaN(numericDocId)) {
      return new Response(
        JSON.stringify({ error: "Invalid document_id: must be a valid number" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get document content to verify it exists
    const { data: document, error: docError } = await supabase
      .from('document_content')
      .select('id')
      .eq('id', numericDocId)
      .eq('client_id', client_id)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch document content",
          details: docError?.message || "Document not found"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: docError ? 500 : 404,
        }
      );
    }

    // Check if the record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('assistant_documents')
      .select('*')
      .eq('assistant_id', assistant_id)
      .eq('document_id', numericDocId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {  // Ignore "no rows returned" error
      return new Response(
        JSON.stringify({
          error: "Failed to check existing record",
          details: checkError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Update or insert based on whether the record exists
    const operation = existingRecord
      ? supabase
          .from('assistant_documents')
          .update({
            status: 'ready',
            updated_at: new Date().toISOString()
          })
          .eq('assistant_id', assistant_id)
          .eq('document_id', numericDocId)
      : supabase
          .from('assistant_documents')
          .insert([{
            assistant_id,
            document_id: numericDocId,
            status: 'ready',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

    const { error: opError } = await operation;

    if (opError) {
      return new Response(
        JSON.stringify({
          error: "Failed to update assistant document record",
          details: opError.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        status: "success",
        message: "Assistant granted access to document",
        document_id: numericDocId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: unknown) {
    console.error("Error in give-assistant-access function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 
