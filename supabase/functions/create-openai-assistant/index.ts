
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      console.error("Missing OpenAI API key");
      throw new Error("Server is not configured with OpenAI API key");
    }
    
    // Parse the request body
    const requestData = await req.json();
    const { agent_name, agent_description, client_id, client_name } = requestData;
    
    if (!agent_name || !client_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: agent_name and client_id are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log(`Creating/updating OpenAI assistant for client ${client_id} with name "${agent_name}"`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if this client already has an OpenAI assistant ID
    const { data, error } = await supabase
      .from("ai_agents")
      .select("openai_assistant_id")
      .eq("client_id", client_id)
      .maybeSingle();
    
    // Prepare a system prompt
    let systemPrompt = agent_description || "";
    if (systemPrompt.trim() === "") {
      systemPrompt = `You are ${agent_name}, an AI assistant for ${client_name || "this organization"}. 
Your goal is to provide clear, concise, and accurate information to users based on the knowledge provided to you.`;
    }
    
    let assistantId = data?.openai_assistant_id;
    let actionType = "created";
    
    // Make the OpenAI API call
    if (assistantId) {
      // Update existing assistant
      actionType = "updated";
      const response = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({
          name: agent_name,
          instructions: systemPrompt,
          model: "gpt-4o-mini"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        
        // If the assistant doesn't exist anymore, create a new one
        if (response.status === 404) {
          assistantId = null;
        } else {
          throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
        }
      } else {
        const responseData = await response.json();
        console.log("Updated OpenAI assistant:", responseData.id);
      }
    }
    
    // Create a new assistant if needed
    if (!assistantId) {
      const response = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({
          name: agent_name,
          instructions: systemPrompt,
          model: "gpt-4o-mini"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }
      
      const responseData = await response.json();
      assistantId = responseData.id;
      console.log("Created new OpenAI assistant:", assistantId);
      
      // Store the assistant ID in the database
      const { error: updateError } = await supabase
        .from("ai_agents")
        .update({ 
          openai_assistant_id: assistantId,
          settings: {
            ...data?.settings,
            openai_assistant_id: assistantId,
            last_updated: new Date().toISOString()
          }
        })
        .eq("client_id", client_id);
      
      if (updateError) {
        console.error("Error updating ai_agents with assistant ID:", updateError);
      }
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        assistant_id: assistantId,
        action: actionType
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error("Error in create-openai-assistant function:", err);
    
    return new Response(
      JSON.stringify({ 
        error: err.message || "Failed to create/update OpenAI assistant", 
        details: JSON.stringify(err)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
