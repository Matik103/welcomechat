
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Get environment variables
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create clients
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
    if (!DEEPSEEK_API_KEY) {
      console.error("Missing DeepSeek API key");
      return new Response(
        JSON.stringify({
          error: "DeepSeek API key is not configured. Please add it in the Supabase dashboard under Settings > API.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

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

    // Create assistant using DeepSeek API
    const response = await fetch("https://api.deepseek.com/v1/assistants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        name: agent_name,
        instructions: `You are a helpful AI assistant named ${agent_name}. ${agent_description || ''}

When answering questions:
1. Use the provided context from retrieved documents when available
2. Cite specific parts of documents when referencing them
3. If the answer isn't in the provided context, say so clearly
4. Stay factual and avoid speculation
5. If you need clarification, ask the user
6. Format your responses in clear, readable markdown`,
        model: "deepseek-chat",
        tools: [
          { type: "retrieval" }
        ],
        metadata: {
          client_id: client_id,
          client_name: client_name || "",
          created_at: new Date().toISOString(),
        },
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("DeepSeek API error:", responseData);
      return new Response(
        JSON.stringify({ error: `DeepSeek API error: ${responseData.error?.message || "Unknown error"}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status,
        }
      );
    }

    console.log("Successfully created DeepSeek assistant:", responseData.id);

    // Update the ai_agents table with the assistant ID
    const { error: updateError } = await supabase
      .from("ai_agents")
      .update({ deepseek_assistant_id: responseData.id })
      .eq("client_id", client_id)
      .eq("interaction_type", "config");

    if (updateError) {
      console.error("Error updating ai_agents table:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update assistant ID in database" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Return the successful response
    return new Response(
      JSON.stringify({
        assistant_id: responseData.id,
        status: "success",
        message: "DeepSeek assistant created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in create-deepseek-assistant function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
