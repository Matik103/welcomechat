
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Response {
  updated_count: number;
  client_count: number;
  error_count: number;
  detail?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged-in user
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('Authorization header is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authorization } },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if the user is an admin or superadmin
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError || !roles || roles.length === 0) {
      throw new Error('Could not verify user role');
    }

    const isAdmin = roles.some(role => 
      role.role === 'admin' || role.role === 'superadmin'
    );

    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Process agent name updates
    const result = await updateAgentNames(supabaseClient);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        updated_count: 0,
        client_count: 0,
        error_count: 1 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function updateAgentNames(supabase: SupabaseClient): Promise<Response> {
  let updated_count = 0;
  let client_count = 0;
  let error_count = 0;
  const results = [];

  try {
    // Get all clients with non-null agent_name values
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, agent_name, client_name')
      .not('agent_name', 'is', null);

    if (clientsError) {
      throw new Error(`Error fetching clients: ${clientsError.message}`);
    }

    client_count = clients.length;
    console.log(`Processing ${client_count} clients`);

    // For each client, update their AI agents to match the client's agent_name
    for (const client of clients) {
      try {
        if (!client.agent_name) continue; // Skip if agent_name is null

        // Get AI agents for this client that have mismatched names
        const { data: agents, error: agentsError } = await supabase
          .from('ai_agents')
          .select('id, name')
          .eq('client_id', client.id)
          .neq('name', client.agent_name);

        if (agentsError) {
          console.error(`Error fetching agents for client ${client.id}:`, agentsError);
          error_count++;
          continue;
        }

        if (!agents || agents.length === 0) continue; // No mismatches for this client

        console.log(`Updating ${agents.length} agents for client ${client.client_name} (${client.id})`);

        // Update all mismatched agents
        const { error: updateError } = await supabase
          .from('ai_agents')
          .update({ 
            name: client.agent_name,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', client.id)
          .neq('name', client.agent_name);

        if (updateError) {
          console.error(`Error updating agents for client ${client.id}:`, updateError);
          error_count++;
        } else {
          updated_count += agents.length;
          results.push({
            client_id: client.id,
            client_name: client.client_name,
            updated_count: agents.length
          });
        }
      } catch (clientError) {
        console.error(`Error processing client ${client.id}:`, clientError);
        error_count++;
      }
    }

    // Log activity
    if (updated_count > 0) {
      await supabase
        .from('client_activities')
        .insert({
          client_id: results[0]?.client_id || null, // Use first client or null
          activity_type: 'admin_action',
          description: `Admin updated ${updated_count} AI agent names across ${results.length} clients`,
          metadata: {
            action: 'update_agent_names',
            results: results
          }
        });
    }

    return {
      updated_count,
      client_count,
      error_count,
      detail: `Updated ${updated_count} agents across ${results.length} clients with ${error_count} errors`
    };
  } catch (error) {
    console.error('Error in updateAgentNames:', error);
    throw error;
  }
}
