
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Execute SQL function called");
    
    // Create a Supabase client with the service role key (required for direct SQL execution)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the current user to verify they have admin rights
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser()

    if (userError) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: `Authentication error: ${userError.message}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user) {
      console.error("No user found in request");
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No user found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User authenticated: ${user.email}`);

    // Verify user has admin role
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      return new Response(
        JSON.stringify({ error: `Role verification error: ${rolesError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isAdmin = roles.some(r => r.role === 'admin')
    if (!isAdmin) {
      console.error(`User ${user.email} is not an admin`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Admin verified: ${user.email}`);

    // Get the SQL to execute from the request
    const requestData = await req.json();
    const { sql } = requestData;

    if (!sql) {
      return new Response(
        JSON.stringify({ error: 'Missing SQL query' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Executing SQL: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);

    // Execute the SQL using the service role (bypassing RLS)
    const { data, error } = await supabaseClient.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error("SQL execution error:", error);
      return new Response(
        JSON.stringify({ error: `SQL execution error: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("SQL executed successfully");
    
    return new Response(
      JSON.stringify({ result: data || 'SQL executed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
