
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/middleware/cors.ts";
import { DEEPSEEK_API_KEY } from "../_shared/config.ts";
import { DeepSeekRequest, DeepSeekResponse } from "../_shared/types/index.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { client_id, query, messages, system_prompt, use_history = false, temperature = 0.7 } = await req.json() as DeepSeekRequest;

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: "Client ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!query && (!messages || messages.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Query or messages are required" }),
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

    // Prepare messages for the DeepSeek API
    let chatMessages = [];

    if (system_prompt) {
      chatMessages.push({ role: "system", content: system_prompt });
    } else {
      chatMessages.push({ role: "system", content: "You are a helpful AI assistant. Answer questions accurately and helpfully." });
    }

    if (use_history && messages && messages.length > 0) {
      // Include conversation history
      chatMessages = [...chatMessages, ...messages];
    }

    // Add the current query as the last user message
    if (query) {
      chatMessages.push({ role: "user", content: query });
    }

    // Call DeepSeek API
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: chatMessages,
        temperature: temperature,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("DeepSeek API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Error querying DeepSeek assistant", details: errorData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }

    const data = await response.json();

    // Extract the assistant's response
    const assistantMessage = data.choices[0].message.content;

    // Prepare the response
    const result: DeepSeekResponse = {
      answer: assistantMessage,
      messages: [...chatMessages, { role: "assistant", content: assistantMessage }]
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error querying DeepSeek assistant:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
