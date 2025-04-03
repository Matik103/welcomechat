import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { OpenAI } from "https://esm.sh/openai@4.28.0";

// Get environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
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
    // Check for API key
    if (!OPENAI_API_KEY) {
      console.error("Missing OpenAI API key");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key is not configured. Please add it in the Supabase dashboard under Settings > API.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Parse request body
    const { client_id, file_data, file_name } = await req.json();

    // Validate required fields
    if (!client_id || !file_data || !file_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: client_id, file_data, and file_name are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Processing file "${file_name}" for client ${client_id}`);

    // Convert base64 to text
    const fileContent = Uint8Array.from(atob(file_data), c => c.charCodeAt(0));
    const textDecoder = new TextDecoder('utf-8');
    const textContent = textDecoder.decode(fileContent);

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Generate embedding for the text content
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: textContent.trim(),
    });

    if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
      throw new Error("Failed to generate embedding from OpenAI");
    }

    const embedding = embeddingResponse.data[0].embedding;

    // Store file in document-storage bucket
    const timestamp = new Date().getTime();
    const storagePath = `${client_id}/${timestamp}_${file_name}`;
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from('document-storage')
      .upload(storagePath, fileContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (storageError) {
      console.error("Error storing file:", storageError);
      return new Response(
        JSON.stringify({ error: `Failed to store file: ${storageError.message}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Get the public URL for the stored file
    const { data: { publicUrl } } = supabase.storage
      .from('document-storage')
      .getPublicUrl(storagePath);

    // Store document metadata and embedding
    const { data: documentData, error: documentError } = await supabase.rpc('store_document_embedding', {
      p_client_id: client_id,
      p_document_id: timestamp.toString(),
      p_content: textContent,
      p_embedding: embedding
    });

    if (documentError) {
      console.error("Error storing document embedding:", documentError);
      return new Response(
        JSON.stringify({ error: `Failed to store document embedding: ${documentError.message}` }),
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
        message: "File processed and stored successfully",
        file_url: publicUrl,
        document_id: timestamp
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in upload-file-to-openai function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
