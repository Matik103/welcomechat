
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt template to ensure assistants only respond to client-specific questions
const SYSTEM_PROMPT_TEMPLATE = `You are an AI assistant created within the ByClicks AI system, designed to serve individual clients with their own unique knowledge bases. Each assistant is assigned to a specific client, and must only respond based on the information available for that specific client.

Rules & Limitations:
✅ Client-Specific Knowledge Only:
- You must only provide answers based on the knowledge base assigned to your specific client.
- If a question is outside your assigned knowledge, politely decline to answer.

✅ Professional, Friendly, and Helpful:
- Maintain a conversational and approachable tone.
- Always prioritize clear, concise, and accurate responses.

🚫 Do NOT Answer These Types of Questions:
- Personal or existential questions (e.g., "What's your age?" or "Do you have feelings?").
- Philosophical or abstract discussions (e.g., "What is the meaning of life?").
- Technical questions about your own system or how you are built.
- Anything unrelated to the client you are assigned to serve.

Example Responses for Off-Limit Questions:
- "I'm here to assist with questions related to [CLIENT_NAME] and their business. How can I help you with that?"
- "I focus on providing support for [CLIENT_NAME]. If you need assistance with something else, I recommend checking an appropriate resource."
- "I'm designed to assist with [CLIENT_NAME]'s needs. Let me know how I can help with that!"`;

// Get client-specific system prompt
function getClientSystemPrompt(clientName: string, agentName: string): string {
  return SYSTEM_PROMPT_TEMPLATE.replace(/\[CLIENT_NAME\]/g, clientName || agentName || "this business");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    const { prompt, agent_name, webhook_url, client_id, context } = requestData;

    if (!prompt) {
      console.error("Missing prompt in request");
      return new Response(JSON.stringify({ error: 'Missing prompt parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing chat request with prompt: "${prompt.substring(0, 50)}..." for agent "${agent_name || 'AI Assistant'}"`);
    console.log(`Webhook URL provided: ${webhook_url || 'None'}`);
    console.log(`Client ID provided: ${client_id || 'None'}`);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get agent content and check for OpenAI assistant ID
    let agentContext = context || '';
    let clientName = '';
    let openaiAssistantId = '';
    
    if (client_id && agent_name) {
      try {
        console.log(`Fetching agent data for client: ${client_id}, agent: ${agent_name}`);
        
        // Get client info first to get the client name
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("client_name, widget_settings")
          .eq("id", client_id)
          .single();
        
        if (!clientError && clientData) {
          clientName = clientData.client_name;
          console.log(`Client name found: ${clientName}`);
          
          // Check for OpenAI assistant ID in widget settings
          if (clientData.widget_settings && 
              typeof clientData.widget_settings === 'object' && 
              clientData.widget_settings.openai_assistant_id) {
            openaiAssistantId = clientData.widget_settings.openai_assistant_id;
            console.log(`Found OpenAI assistant ID: ${openaiAssistantId}`);
          }
        }
        
        if (!openaiAssistantId) {
          // Check in ai_agents table for the assistant ID
          const { data: agentData, error: agentError } = await supabase
            .from("ai_agents")
            .select("openai_assistant_id, content")
            .eq("client_id", client_id)
            .order("created_at", { ascending: false })
            .limit(1);
          
          if (!agentError && agentData && agentData.length > 0) {
            openaiAssistantId = agentData[0].openai_assistant_id || '';
            
            if (openaiAssistantId) {
              console.log(`Found OpenAI assistant ID from AI agents table: ${openaiAssistantId}`);
            }
            
            // If no OpenAI assistant, use traditional content approach
            if (!openaiAssistantId && agentData[0].content) {
              agentContext = agentData[0].content;
              console.log(`Using agent content of length: ${agentContext.length}`);
            }
          }
        }
      } catch (contentError) {
        console.error("Error getting agent data:", contentError);
      }
    }
    
    // If we have an OpenAI assistant ID, use Assistants API
    if (openAIApiKey && openaiAssistantId) {
      try {
        console.log(`Using OpenAI assistant ID: ${openaiAssistantId}`);
        
        // Create a thread for this conversation
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v1'
          },
          body: JSON.stringify({})
        });
        
        if (!threadResponse.ok) {
          const errorData = await threadResponse.json();
          console.error("Error creating thread:", errorData);
          throw new Error(`Thread creation error: ${JSON.stringify(errorData)}`);
        }
        
        const threadData = await threadResponse.json();
        const threadId = threadData.id;
        console.log(`Created thread: ${threadId}`);
        
        // Add the user's message to the thread
        const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v1'
          },
          body: JSON.stringify({
            role: 'user',
            content: prompt
          })
        });
        
        if (!messageResponse.ok) {
          const errorData = await messageResponse.json();
          console.error("Error adding message to thread:", errorData);
          throw new Error(`Message creation error: ${JSON.stringify(errorData)}`);
        }
        
        console.log("Added user message to thread");
        
        // Run the assistant on the thread
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v1'
          },
          body: JSON.stringify({
            assistant_id: openaiAssistantId
          })
        });
        
        if (!runResponse.ok) {
          const errorData = await runResponse.json();
          console.error("Error running assistant:", errorData);
          throw new Error(`Run creation error: ${JSON.stringify(errorData)}`);
        }
        
        const runData = await runResponse.json();
        let runId = runData.id;
        console.log(`Started run: ${runId}`);
        
        // Poll for run completion
        let runStatus = runData.status;
        let maxRetries = 10;
        let generatedText = "";
        
        while (runStatus !== 'completed' && runStatus !== 'failed' && maxRetries > 0) {
          // Wait a bit before checking status
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const runStatusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v1'
            }
          });
          
          if (!runStatusResponse.ok) {
            const errorData = await runStatusResponse.json();
            console.error("Error checking run status:", errorData);
            throw new Error(`Run status error: ${JSON.stringify(errorData)}`);
          }
          
          const statusData = await runStatusResponse.json();
          runStatus = statusData.status;
          console.log(`Run status: ${runStatus}`);
          maxRetries--;
        }
        
        if (runStatus === 'completed') {
          // Get messages from the thread
          const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v1'
            }
          });
          
          if (!messagesResponse.ok) {
            const errorData = await messagesResponse.json();
            console.error("Error retrieving messages:", errorData);
            throw new Error(`Messages retrieval error: ${JSON.stringify(errorData)}`);
          }
          
          const messagesData = await messagesResponse.json();
          
          // Get the assistant's response from the most recent message
          for (const message of messagesData.data) {
            if (message.role === 'assistant') {
              generatedText = message.content[0].text.value;
              break;
            }
          }
          
          console.log(`Retrieved assistant response (${generatedText.length} chars)`);
          
          // Log interaction in the database
          try {
            await supabase
              .from("agent_queries")
              .insert({
                client_id,
                agent_name,
                query: prompt,
                response: generatedText,
                query_time: new Date().toISOString(),
                metadata: { 
                  openai_assistant_id: openaiAssistantId,
                  thread_id: threadId,
                  run_id: runId
                }
              });
            console.log("Interaction logged to database");
          } catch (logError) {
            console.error("Failed to log interaction:", logError);
          }
          
          return new Response(JSON.stringify({ generatedText }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          console.error(`Run failed or timed out: ${runStatus}`);
          throw new Error(`Assistant run ${runStatus}`);
        }
      } catch (assistantError) {
        console.error("Error using OpenAI assistant, falling back to regular completion:", assistantError);
        // Fall back to regular completion if assistant API fails
      }
    }

    // Continue with original code for webhook or standard completion
    if (webhook_url) {
      try {
        console.log(`Using webhook URL: ${webhook_url}`);
        
        // Call webhook with the prompt
        const webhookResponse = await fetch(webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt, 
            context: agentContext,
            client_id,
            agent_name
          }),
        });
        
        if (!webhookResponse.ok) {
          throw new Error(`Webhook returned ${webhookResponse.status}`);
        }
        
        const webhookData = await webhookResponse.json();
        console.log(`Webhook response received (${JSON.stringify(webhookData).length} chars)`);
        
        // Log interaction in the database if client_id is provided
        if (client_id) {
          try {
            await supabase
              .from("agent_queries")
              .insert({
                client_id,
                agent_name: agent_name || 'AI Assistant',
                query: prompt,
                response: webhookData.generatedText || webhookData.response || '',
                query_time: new Date().toISOString(),
                metadata: { webhook_url }
              });
            console.log("Webhook interaction logged to database");
          } catch (logError) {
            console.error("Failed to log webhook interaction:", logError);
          }
        }
        
        return new Response(JSON.stringify(webhookData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (webhookError) {
        console.error("Webhook error:", webhookError);
        return new Response(JSON.stringify({ error: `Webhook error: ${webhookError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (openAIApiKey) {
      // Default to using OpenAI API directly
      try {
        console.log("Using OpenAI API directly");
        
        // Get system prompt
        const systemPrompt = getClientSystemPrompt(clientName, agent_name || "AI Assistant");
        
        // Prepare context message if exists
        const messages = [
          {
            role: "system",
            content: systemPrompt + (agentContext ? `\n\nClient knowledge: ${agentContext}` : '')
          },
          {
            role: "user",
            content: prompt
          }
        ];
        
        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("OpenAI API error:", errorData);
          throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        console.log("OpenAI response received");
        
        const generatedText = data.choices[0].message.content;
        
        // Log interaction in the database if client_id is provided
        if (client_id) {
          try {
            await supabase
              .from("agent_queries")
              .insert({
                client_id,
                agent_name: agent_name || 'AI Assistant',
                query: prompt,
                response: generatedText,
                query_time: new Date().toISOString(),
                metadata: { model: "gpt-4o-mini" }
              });
            console.log("OpenAI interaction logged to database");
          } catch (logError) {
            console.error("Failed to log OpenAI interaction:", logError);
          }
        }
        
        return new Response(JSON.stringify({ generatedText }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        return new Response(JSON.stringify({ error: `OpenAI API error: ${openaiError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.error("No webhook URL or OpenAI API key provided");
      return new Response(JSON.stringify({ error: 'No webhook URL or OpenAI API key configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
