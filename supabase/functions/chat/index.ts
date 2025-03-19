
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { prompt, agent_name, webhook_url } = requestData;

    if (!prompt) {
      console.error("Missing prompt in request");
      return new Response(JSON.stringify({ error: 'Missing prompt parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing chat request with prompt: "${prompt.substring(0, 50)}..." for agent "${agent_name || 'AI Assistant'}"`);
    console.log(`Webhook URL provided: ${webhook_url || 'None'}`);

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

    // Default to OpenAI if no webhook or webhook failed
    console.log("Calling OpenAI API");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are ${agent_name || 'an AI assistant'}, a helpful AI assistant. Keep your responses friendly and concise.`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 250
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
