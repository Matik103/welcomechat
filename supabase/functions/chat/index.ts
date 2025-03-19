
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
    
    // Get agent content if we have a client_id but no context provided
    let agentContext = context || '';
    
    if (client_id && agent_name && !context) {
      try {
        console.log(`Fetching agent content for client: ${client_id}, agent: ${agent_name}`);
        
        // Get the most recent content from the agent
        const { data, error } = await supabase
          .from("ai_agents")
          .select("content")
          .eq("client_id", client_id)
          .eq("name", agent_name)
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (error) {
          console.error("Error fetching AI agent content:", error);
        } else if (data && data.length > 0) {
          // Combine all content to provide context
          agentContext = data
            .filter(item => item.content && item.content.trim().length > 0)
            .map(item => item.content)
            .join("\n\n");
          
          console.log(`Retrieved ${data.length} content entries for context`);
        }
      } catch (contentError) {
        console.error("Error getting agent content:", contentError);
      }
    }

    // Attempt to call external webhook if specified
    if (webhook_url) {
      try {
        console.log(`Attempting to call webhook at: ${webhook_url}`);
        const webhookResponse = await fetch(webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            agent_name,
            client_id,
            // Don't pass webhook_url to avoid potential infinite loops
          }),
        });
        
        if (webhookResponse.ok) {
          const webhookData = await webhookResponse.json();
          console.log("Successfully received webhook response");
          return new Response(JSON.stringify({ 
            generatedText: webhookData.response || webhookData.message || webhookData.generatedText,
            webhook_used: true
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          console.error(`Webhook returned status: ${webhookResponse.status}`);
          const errorText = await webhookResponse.text();
          console.error(`Webhook error: ${errorText}`);
          // Continue with OpenAI fallback if webhook fails
        }
      } catch (webhookError) {
        console.error("Webhook call failed, falling back to default response:", webhookError);
        // Continue with OpenAI fallback if webhook fails
      }
    }

    // If no OpenAI key is set, return a demo response
    if (!openAIApiKey) {
      console.log("No OpenAI API key set, returning demo response");
      return new Response(JSON.stringify({ 
        generatedText: `Hello! I'm ${agent_name || 'your AI assistant'}. This is a demo response. Configure OpenAI API key for real responses, or set up a webhook URL.` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log if we're using context
    if (agentContext) {
      console.log(`Using context of length: ${agentContext.length} characters`);
    } else {
      console.log("No context available for this request");
    }

    // Default to OpenAI if no webhook or webhook failed
    console.log("Calling OpenAI API");
    
    // Prepare system message with context if available
    const systemMessage = `You are ${agent_name || 'an AI assistant'}, a helpful AI assistant. 
Keep your responses friendly and concise.${agentContext ? `\n\nHere's information to help answer the user's question:\n${agentContext.substring(0, 8000)}` : ''}`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log(`Successfully generated response (${generatedText.length} chars)`);
    
    // Log interaction in the database if client_id is provided
    if (client_id && agent_name) {
      try {
        await supabase
          .from("agent_queries")
          .insert({
            client_id,
            agent_name,
            query: prompt,
            response: generatedText,
            query_time: new Date().toISOString()
          });
        console.log("Interaction logged to database");
      } catch (logError) {
        console.error("Failed to log interaction:", logError);
      }
    }

    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred while processing your request',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
