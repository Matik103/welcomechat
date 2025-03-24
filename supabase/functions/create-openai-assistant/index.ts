import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    const { client_id, agent_name, agent_description } = await req.json()

    if (!client_id || !agent_name) {
      return new Response(
        JSON.stringify({ error: 'client_id and agent_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create OpenAI Assistant
    const assistant = await openai.beta.assistants.create({
            name: agent_name,
      description: agent_description || `Assistant for ${agent_name}`,
      model: 'gpt-4-turbo-preview',
      tools: [{ type: 'retrieval' }],
      instructions: `You are an AI assistant for ${agent_name}. Your purpose is to help users with their questions and tasks related to the documents and information provided.`
    })

    // Update the ai_agents record with the assistant ID
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabaseClient
      .from('ai_agents')
      .update({ openai_assistant_id: assistant.id })
      .eq('client_id', client_id)
      .eq('interaction_type', 'config')
          
          if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        assistant_id: assistant.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
