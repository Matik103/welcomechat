
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/middleware/cors.ts";
import { DEEPSEEK_API_KEY } from "../_shared/config.ts";
import { DeepSeekAssistantRequest } from "../_shared/types/index.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { client_id, agent_name, agent_description, client_name } = await req.json() as DeepSeekAssistantRequest;

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: "Client ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!agent_name) {
      return new Response(
        JSON.stringify({ error: "Agent name is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if DeepSeek API key is available
    if (!DEEPSEEK_API_KEY) {
      console.error("DeepSeek API key is not configured");
      return new Response(
        JSON.stringify({ error: "DeepSeek API key not configured", missingKey: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // System prompt for the assistant
    const systemPrompt = agent_description || 
      `You are a helpful AI assistant named ${agent_name}. You help customers of ${client_name || 'the company'} by answering their questions accurately and helpfully.`;

    // Call DeepSeek API to create an assistant
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Hello! Please confirm you're ready to help." }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("DeepSeek API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Error creating DeepSeek assistant", details: errorData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        assistant_id: `deepseek_${client_id}_${Date.now()}`, // Generate a unique ID
        message: `DeepSeek assistant "${agent_name}" created successfully`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating DeepSeek assistant:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
