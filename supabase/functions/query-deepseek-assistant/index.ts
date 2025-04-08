
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { handleError, AppError, errorCodes } from "../_shared/middleware/errorHandler.ts";

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
    console.log("🔍 Starting query-deepseek-assistant function");
    
    // Check for API key
    if (!DEEPSEEK_API_KEY) {
      console.error("⚠️ Missing DeepSeek API key");
      throw new AppError(
        500,
        "DeepSeek API key is not configured. Please add it in the Supabase dashboard under Settings > API.",
        errorCodes.UNAUTHORIZED,
        { missingKey: true }
      );
    }

    // Parse request body
    const { client_id, query } = await req.json();

    if (!client_id || !query) {
      console.error("❌ Missing required fields");
      throw new AppError(
        400,
        "Missing required fields: client_id and query are required",
        errorCodes.INVALID_INPUT
      );
    }

    console.log(`📝 Processing query for client_id: ${client_id}`);
    
    // Get the DeepSeek assistant ID for this client
    const { data: clientData, error: clientError } = await supabase
      .from('ai_agents')
      .select('deepseek_assistant_id, agent_description')
      .eq('client_id', client_id)
      .eq('interaction_type', 'config')
      .single();
      
    if (clientError) {
      console.error("❌ Error fetching client data:", clientError);
      throw new AppError(
        500,
        `Error fetching client data: ${clientError.message}`,
        errorCodes.DATABASE_ERROR
      );
    }
    
    if (!clientData?.deepseek_assistant_id) {
      console.error("❌ No DeepSeek assistant ID found for client:", client_id);
      throw new AppError(
        404,
        "No DeepSeek assistant configured for this client. Please create a DeepSeek assistant first.",
        errorCodes.NOT_FOUND,
        { noAssistant: true }
      );
    }
    
    const assistantId = clientData.deepseek_assistant_id;
    console.log(`🤖 Using DeepSeek assistant ID: ${assistantId}`);
    
    // Create a thread
    console.log("🧵 Creating thread...");
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
      const errorText = await threadResponse.text();
      console.error("❌ Failed to create thread:", errorText);
      throw new AppError(
        threadResponse.status,
        `Failed to create thread: ${errorText}`,
        errorCodes.OPENAI_ERROR
      );
    }
    
    const threadData = await threadResponse.json();
    const threadId = threadData.id;
    console.log(`✅ Created thread: ${threadId}`);
    
    // Add a message to the thread
    console.log("💬 Adding message to thread...");
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
      const errorText = await messageResponse.text();
      console.error("❌ Failed to add message:", errorText);
      throw new AppError(
        messageResponse.status,
        `Failed to add message to thread: ${errorText}`, 
        errorCodes.OPENAI_ERROR
      );
    }
    
    console.log(`✅ Added message to thread ${threadId}`);
    
    // Run the assistant
    console.log("🏃 Running the assistant...");
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
      const errorText = await runResponse.text();
      console.error("❌ Failed to run assistant:", errorText);
      throw new AppError(
        runResponse.status,
        `Failed to run assistant: ${errorText}`,
        errorCodes.OPENAI_ERROR
      );
    }
    
    const runData = await runResponse.json();
    const runId = runData.id;
    console.log(`✅ Started run ${runId}`);
    
    // Poll for completion
    let runStatus = "queued";
    let attempts = 0;
    const maxAttempts = 30;
    
    console.log("⏳ Polling for completion...");
    while (runStatus !== "completed" && runStatus !== "failed" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const checkRunResponse = await fetch(`https://api.deepseek.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
        }
      });
      
      if (!checkRunResponse.ok) {
        const errorText = await checkRunResponse.text();
        console.error("❌ Failed to check run status:", errorText);
        throw new AppError(
          checkRunResponse.status,
          `Failed to check run status: ${errorText}`,
          errorCodes.OPENAI_ERROR
        );
      }
      
      const checkData = await checkRunResponse.json();
      runStatus = checkData.status;
      attempts++;
      
      console.log(`🔄 Run status: ${runStatus}, attempt ${attempts}/${maxAttempts}`);
    }
    
    if (runStatus !== "completed") {
      console.error(`❌ Run did not complete in time, status: ${runStatus}`);
      throw new AppError(
        500,
        `Run did not complete in time, status: ${runStatus}`,
        errorCodes.OPENAI_ERROR
      );
    }
    
    // Get messages from the thread
    console.log("📨 Getting messages from thread...");
    const listMessagesResponse = await fetch(`https://api.deepseek.com/v1/threads/${threadId}/messages`, {
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      }
    });
    
    if (!listMessagesResponse.ok) {
      const errorText = await listMessagesResponse.text();
      console.error("❌ Failed to list messages:", errorText);
      throw new AppError(
        listMessagesResponse.status,
        `Failed to list messages: ${errorText}`,
        errorCodes.OPENAI_ERROR
      );
    }
    
    const messagesData = await listMessagesResponse.json();
    
    // Find the assistant's response (should be the latest message)
    const assistantMessages = messagesData.data.filter(msg => msg.role === "assistant");
    
    if (assistantMessages.length === 0) {
      console.error("❌ No assistant response found");
      throw new AppError(
        500,
        "No assistant response found",
        errorCodes.NOT_FOUND
      );
    }
    
    const latestResponse = assistantMessages[0];
    
    // Return the answer
    console.log("✅ Successfully processed query, returning response");
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
    console.error("❌ Error in query-deepseek-assistant function:", error);
    return handleError(error);
  }
});
