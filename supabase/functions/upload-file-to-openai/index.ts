
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Get OpenAI API key from environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

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

  try {
    // Parse request body
    const formData = await req.formData();
    const file = formData.get("file");
    const assistantId = formData.get("assistant_id");
    const purpose = formData.get("purpose") || "assistants";
    
    // Validate required fields
    if (!file || !assistantId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: file and assistant_id are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Uploading file to OpenAI for assistant ${assistantId}`);

    // First upload the file to OpenAI
    const fileResponse = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: (() => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", purpose);
        return formData;
      })(),
    });

    const fileData = await fileResponse.json();

    if (!fileResponse.ok) {
      console.error("OpenAI file upload error:", fileData);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${fileData.error?.message || "Unknown error"}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: fileResponse.status,
        }
      );
    }

    console.log("Successfully uploaded file to OpenAI:", fileData.id);

    // Now attach the file to the assistant
    const attachResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2", // Using v2 of the API
      },
      body: JSON.stringify({
        file_id: fileData.id
      }),
    });

    const attachData = await attachResponse.json();

    if (!attachResponse.ok) {
      console.error("OpenAI assistant file attachment error:", attachData);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${attachData.error?.message || "Failed to attach file to assistant"}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: attachResponse.status,
        }
      );
    }

    console.log("Successfully attached file to OpenAI assistant");

    // Return the successful response
    return new Response(
      JSON.stringify({
        file_id: fileData.id,
        assistant_file_id: attachData.id,
        status: "success",
        message: "File uploaded and attached to OpenAI assistant successfully",
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
