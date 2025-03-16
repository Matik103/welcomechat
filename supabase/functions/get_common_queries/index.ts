
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get client_id and agent_name parameters
    const params = new URL(req.url).searchParams
    const clientId = params.get('client_id')
    const agentName = params.get('agent_name')
    const limit = parseInt(params.get('limit') || '10', 10)

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'client_id parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Build the query based on whether agent_name is provided
    let query = supabaseClient
      .from('ai_agents')
      .select('query_text, COUNT(*)')
      .eq('client_id', clientId)
      .eq('interaction_type', 'chat_interaction')
      .not('query_text', 'is', null)
    
    // Add agent name filter if provided
    if (agentName) {
      query = query.eq('name', agentName)
    }
    
    // Complete the query
    const { data, error } = await query
      .group('query_text')
      .order('count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error getting common queries:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform the data to match the expected format
    const formattedData = data.map(item => ({
      query_text: item.query_text,
      frequency: parseInt(item.count, 10)
    }))

    // Return the data
    return new Response(
      JSON.stringify(formattedData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
