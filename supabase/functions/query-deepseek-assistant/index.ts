
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Get environment variables
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
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
    if (!DEEPSEEK_API_KEY) {
      throw new Error("Missing DeepSeek API key");
    }

    // Parse request body
    const { client_id, query } = await req.json();

    if (!client_id || !query) {
      throw new Error("Missing required fields: client_id and query are required");
    }

    console.log(`Processing query for client_id: ${client_id}`);
    
    // Get the DeepSeek assistant ID for this client
    const { data: clientData, error: clientError } = await supabase
      .from('ai_agents')
      .select('deepseek_assistant_id, agent_description')
      .eq('client_id', client_id)
      .eq('interaction_type', 'config')
      .single();
      
    if (clientError || !clientData?.deepseek_assistant_id) {
      throw new Error(`Cannot find DeepSeek assistant for client: ${clientError?.message || 'No assistant configured'}`);
    }
    
    const assistantId = clientData.deepseek_assistant_id;
    console.log(`Using DeepSeek assistant ID: ${assistantId}`);
    
    // Create a thread
    const threadResponse = await fetch("https://api.deepseek.com/v1/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        metadata: {
          client_id: client_id
        }
      })
    });
    
    if (!threadResponse.ok) {
      const threadError = await threadResponse.text();
      throw new Error(`Failed to create thread: ${threadError}`);
    }
    
    const threadData = await threadResponse.json();
    const threadId = threadData.id;
    console.log(`Created thread: ${threadId}`);
    
    // Add a message to the thread
    const messageResponse = await fetch(`https://api.deepseek.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        role: "user",
        content: query
      })
    });
    
    if (!messageResponse.ok) {
      const messageError = await messageResponse.text();
      throw new Error(`Failed to add message to thread: ${messageError}`);
    }
    
    console.log(`Added message to thread ${threadId}`);
    
    // Run the assistant
    const runResponse = await fetch(`https://api.deepseek.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });
    
    if (!runResponse.ok) {
      const runError = await runResponse.text();
      throw new Error(`Failed to run assistant: ${runError}`);
    }
    
    const runData = await runResponse.json();
    const runId = runData.id;
    console.log(`Started run ${runId}`);
    
    // Poll for completion
    let runStatus = "queued";
    let attempts = 0;
    const maxAttempts = 30;
    
    while (runStatus !== "completed" && runStatus !== "failed" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const checkRunResponse = await fetch(`https://api.deepseek.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
        }
      });
      
      if (!checkRunResponse.ok) {
        const checkError = await checkRunResponse.text();
        throw new Error(`Failed to check run status: ${checkError}`);
      }
      
      const checkData = await checkRunResponse.json();
      runStatus = checkData.status;
      attempts++;
      
      console.log(`Run status: ${runStatus}, attempt ${attempts}/${maxAttempts}`);
    }
    
    if (runStatus !== "completed") {
      throw new Error(`Run did not complete in time, status: ${runStatus}`);
    }
    
    // Get messages from the thread
    const listMessagesResponse = await fetch(`https://api.deepseek.com/v1/threads/${threadId}/messages`, {
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      }
    });
    
    if (!listMessagesResponse.ok) {
      const listError = await listMessagesResponse.text();
      throw new Error(`Failed to list messages: ${listError}`);
    }
    
    const messagesData = await listMessagesResponse.json();
    
    // Find the assistant's response (should be the latest message)
    const assistantMessages = messagesData.data.filter(msg => msg.role === "assistant");
    
    if (assistantMessages.length === 0) {
      throw new Error("No assistant response found");
    }
    
    const latestResponse = assistantMessages[0];
    
    // Return the answer
    return new Response(
      JSON.stringify({
        answer: latestResponse.content[0].text,
        messages: messagesData.data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in query-deepseek-assistant function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unknown error occurred"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
