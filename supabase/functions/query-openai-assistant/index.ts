
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Get OpenAI API key from environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    const { client_id, query } = await req.json();
    
    if (!client_id || !query) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: client_id and query" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Processing query for client ${client_id}: "${query}"`);
    
    // Get the OpenAI assistant ID for this client
    const { data: aiAgent, error: agentError } = await supabase
      .from("ai_agents")
      .select("openai_assistant_id")
      .eq("client_id", client_id)
      .eq("interaction_type", "config")
      .maybeSingle();
    
    if (agentError) {
      console.error("Error fetching OpenAI assistant ID:", agentError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch OpenAI assistant ID" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    const assistantId = aiAgent?.openai_assistant_id;
    
    if (!assistantId) {
      console.error("No OpenAI assistant ID found for client", client_id);
      return new Response(
        JSON.stringify({ error: "No OpenAI assistant found for this client" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }
    
    // Step 1: Create a Thread
    const threadResponse = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2", // Using v2 of the API
      },
      body: JSON.stringify({}),
    });
    
    const threadData = await threadResponse.json();
    
    if (!threadResponse.ok) {
      console.error("Error creating thread:", threadData);
      return new Response(
        JSON.stringify({ error: "Failed to create conversation thread" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    const threadId = threadData.id;
    
    // Step 2: Add a Message to the Thread
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2", // Using v2 of the API
      },
      body: JSON.stringify({
        role: "user",
        content: query,
      }),
    });
    
    const messageData = await messageResponse.json();
    
    if (!messageResponse.ok) {
      console.error("Error adding message to thread:", messageData);
      return new Response(
        JSON.stringify({ error: "Failed to add message to thread" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    // Step 3: Run the Assistant on the Thread
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2", // Using v2 of the API
      },
      body: JSON.stringify({
        assistant_id: assistantId,
      }),
    });
    
    const runData = await runResponse.json();
    
    if (!runResponse.ok) {
      console.error("Error running assistant:", runData);
      return new Response(
        JSON.stringify({ error: "Failed to run assistant" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    const runId = runData.id;
    
    // Step 4: Check the Run status and wait for completion
    let runStatus = runData.status;
    let attempts = 0;
    const maxAttempts = 30; // Maximum number of attempts (30 * 1s = 30 seconds max)
    
    while (runStatus !== "completed" && runStatus !== "failed" && runStatus !== "expired" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between checks
      
      const runStatusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2", // Using v2 of the API
        },
      });
      
      const runStatusData = await runStatusResponse.json();
      
      if (!runStatusResponse.ok) {
        console.error("Error checking run status:", runStatusData);
        break;
      }
      
      runStatus = runStatusData.status;
      attempts++;
    }
    
    if (runStatus !== "completed") {
      console.error("Run did not complete successfully. Status:", runStatus);
      return new Response(
        JSON.stringify({ error: `Assistant run ${runStatus}. Please try again.` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    // Step 5: Retrieve Messages (including assistant's response)
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2", // Using v2 of the API
      },
    });
    
    const messagesData = await messagesResponse.json();
    
    if (!messagesResponse.ok) {
      console.error("Error retrieving messages:", messagesData);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve assistant's response" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    // Find the assistant's response (should be the first message, as they're returned in reverse chronological order)
    const assistantMessage = messagesData.data.find(msg => msg.role === "assistant");
    
    if (!assistantMessage) {
      console.error("No assistant message found in response");
      return new Response(
        JSON.stringify({ error: "No response generated from assistant" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    // Extract the text content from the message
    const answer = assistantMessage.content[0].text.value;
    
    // Return the assistant's response
    return new Response(
      JSON.stringify({
        answer,
        thread_id: threadId,
        success: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in query-openai-assistant function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
