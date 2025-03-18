
// Edge Function to update all AI agents with correct agent names from client records
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
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables for Supabase client");
      throw new Error("Missing environment variables for Supabase client");
    }
    
    console.log("Creating Supabase client with URL:", supabaseUrl);
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    // Check auth - only admin users should be able to run this function
    // Get the user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Check if the user has admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication error", details: authError }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    if (rolesError) {
      return new Response(
        JSON.stringify({ error: "Error fetching user roles", details: rolesError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const isAdmin = roles?.some(r => r.role === 'admin');
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin role required" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Get all clients with agent_name
    console.log("Fetching clients with agent_name");
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, client_name, agent_name')
      .not('agent_name', 'is', null);
    
    if (clientError) {
      console.error("Error fetching clients:", clientError);
      throw new Error(`Failed to fetch clients: ${clientError.message}`);
    }
    
    if (!clients || clients.length === 0) {
      console.log("No clients found with agent_name");
      return new Response(
        JSON.stringify({ message: "No clients found with agent_name" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log(`Found ${clients.length} clients with agent_name`);
    
    // Process each client
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const client of clients) {
      if (!client.agent_name) continue;
      
      try {
        console.log(`Processing client ${client.id} with agent name ${client.agent_name}`);
        
        // Update AI agents for this client to use the correct agent name
        const { data, error } = await supabase
          .from('ai_agents')
          .update({ name: client.agent_name })
          .eq('client_id', client.id)
          .neq('name', client.agent_name) // Only update records where the name doesn't match
          .select('id');
        
        if (error) {
          console.error(`Error updating ai_agents for client ${client.id}:`, error);
          errorCount++;
          errors.push({
            client_id: client.id,
            client_name: client.client_name,
            error: error.message
          });
        } else {
          console.log(`Updated ${data?.length || 0} AI agent records for client ${client.id}`);
          updatedCount += data?.length || 0;
          
          // Log the update as an activity
          if (data && data.length > 0) {
            await supabase
              .from('client_activities')
              .insert({
                client_id: client.id,
                activity_type: 'ai_agent_updated',
                description: `Updated ${data.length} AI agent records to use correct agent name: ${client.agent_name}`,
                metadata: {
                  agent_name: client.agent_name,
                  updated_count: data.length
                }
              });
          }
        }
      } catch (processError) {
        console.error(`Error processing client ${client.id}:`, processError);
        errorCount++;
        errors.push({
          client_id: client.id,
          client_name: client.client_name,
          error: processError.message
        });
      }
    }
    
    // Return the results
    return new Response(
      JSON.stringify({ 
        success: true,
        updated_count: updatedCount,
        client_count: clients.length,
        error_count: errorCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (err) {
    console.error("Error in update-agent-names function:", err);
    
    return new Response(
      JSON.stringify({ 
        error: err.message || "Failed to update agent names" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
