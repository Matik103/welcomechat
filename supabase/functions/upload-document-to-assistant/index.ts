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

    const { client_id, document_url, document_type } = await req.json()

    if (!client_id || !document_url) {
      return new Response(
        JSON.stringify({ error: 'client_id and document_url are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the OpenAI Assistant ID from the database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: agentData, error: agentError } = await supabaseClient
      .from('ai_agents')
      .select('openai_assistant_id')
      .eq('client_id', client_id)
      .eq('interaction_type', 'config')
      .single()

    if (agentError || !agentData?.openai_assistant_id) {
      throw new Error('Failed to find OpenAI Assistant ID for the client')
    }

    // Download the document from the URL
    const response = await fetch(document_url)
    if (!response.ok) {
      throw new Error('Failed to download document from URL')
    }

    const blob = await response.blob()
    const file = new File([blob], 'document.' + (document_type || 'pdf'), {
      type: document_type === 'txt' ? 'text/plain' : 'application/pdf'
    })

    // Upload the file to OpenAI
    const uploadedFile = await openai.files.create({
      file,
      purpose: 'assistants'
    })

    // Attach the file to the assistant
    await openai.beta.assistants.files.create(
      agentData.openai_assistant_id,
      { file_id: uploadedFile.id }
    )
    
    return new Response(
      JSON.stringify({
        success: true,
        file_id: uploadedFile.id,
        assistant_id: agentData.openai_assistant_id
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
