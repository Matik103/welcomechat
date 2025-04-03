
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Get environment variables
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
    // Parse the form data
    const formData = await req.formData();
    const file = formData.get("file");
    const assistantId = formData.get("assistant_id");

    // Validate required fields
    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid file" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!assistantId || typeof assistantId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid assistant_id" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Uploading file "${file.name}" to OpenAI...`);

    // Step 1: Upload the file to OpenAI
    const fileData = new FormData();
    fileData.append("file", file);
    fileData.append("purpose", "assistants");

    const fileUploadResponse = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: fileData,
    });

    const fileUploadData = await fileUploadResponse.json();

    if (!fileUploadResponse.ok) {
      console.error("OpenAI file upload error:", fileUploadData);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI file upload error: ${fileUploadData.error?.message || JSON.stringify(fileUploadData)}` 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: fileUploadResponse.status,
        }
      );
    }

    const fileId = fileUploadData.id;
    console.log(`File uploaded to OpenAI with ID: ${fileId}`);

    // Step 2: Attach the file to the assistant
    console.log(`Attaching file ${fileId} to assistant ${assistantId}...`);
    
    const attachResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        file_id: fileId,
      }),
    });

    const attachData = await attachResponse.json();

    if (!attachResponse.ok) {
      console.error("OpenAI file attachment error:", attachData);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI file attachment error: ${attachData.error?.message || JSON.stringify(attachData)}` 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: attachResponse.status,
        }
      );
    }

    console.log("Successfully attached file to OpenAI assistant");

    // Return success response
    return new Response(
      JSON.stringify({
        file_id: fileId,
        assistant_file_id: attachData.id,
        status: "success",
        message: "File successfully uploaded and attached to assistant",
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
