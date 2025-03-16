
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
    // Check if we're dealing with a POST request with JSON body
    let clientId;
    let agentName;
    
    if (req.method === 'POST') {
      // Parse the JSON body
      const body = await req.json();
      clientId = body.client_id;
      agentName = body.agent_name;
    } else {
      // Get client_id and agent_name parameters from URL query
      const params = new URL(req.url).searchParams
      clientId = params.get('client_id')
      agentName = params.get('agent_name')
    }

    if (!clientId || !agentName) {
      return new Response(
        JSON.stringify({ 
          error: 'Both client_id and agent_name parameters are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
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

    // Call the dashboard stats function
    const { data, error } = await supabaseClient.rpc(
      'get_agent_dashboard_stats',
      { 
        client_id_param: clientId,
        agent_name_param: agentName
      }
    )

    if (error) {
      console.error('Error getting dashboard stats:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return the data
    return new Response(
      JSON.stringify({ data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
