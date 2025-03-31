
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
    // Parse request body
    const { client_id, agent_name, agent_description, client_name } = await req.json();

    // Validate required fields
    if (!client_id || !agent_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: client_id and agent_name are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Creating assistant for client ${client_id} with name "${agent_name}"`);

    // Call OpenAI API to create assistant with v2 header
    const response = await fetch("https://api.openai.com/v1/assistants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2", // Using v2 of the API
      },
      body: JSON.stringify({
        name: agent_name,
        instructions: agent_description,
        model: "gpt-4o", // Use the latest model for best results
        tools: [{ type: "retrieval" }], // Enable retrieval for document knowledge
        metadata: {
          client_id: client_id,
          client_name: client_name || "",
          created_at: new Date().toISOString(),
        },
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", responseData);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${responseData.error?.message || "Unknown error"}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status,
        }
      );
    }

    console.log("Successfully created OpenAI assistant:", responseData.id);

    // Return the successful response
    return new Response(
      JSON.stringify({
        assistant_id: responseData.id,
        status: "success",
        message: "OpenAI assistant created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in create-openai-assistant function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
