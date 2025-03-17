
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
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
      throw new Error("Missing environment variables for Supabase client");
    }
    
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const { email, password, client_id, client_name, agent_name } = body;
    
    if (!email || !password || !client_id) {
      return new Response(
        JSON.stringify({ error: "Email, password, and client_id are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.listUsers({
      email: email,
    });
    
    if (userCheckError) {
      console.error("Error checking if user exists:", userCheckError);
      return new Response(
        JSON.stringify({ error: `Error checking if user exists: ${userCheckError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    let userId;
    
    // If user exists, update their metadata
    if (existingUser && existingUser.users && existingUser.users.length > 0) {
      console.log("User already exists, updating metadata:", email);
      
      userId = existingUser.users[0].id;
      
      // Update user metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: { 
            client_id,
            client_name,
            agent_name,
            user_type: "client"
          }
        }
      );
      
      if (updateError) {
        console.error("Failed to update user metadata:", updateError);
        return new Response(
          JSON.stringify({ error: `Failed to update user metadata: ${updateError.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } else {
      // Create a new user
      console.log("Creating new user:", email);
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          client_id,
          client_name,
          agent_name,
          user_type: "client"
        }
      });
      
      if (createError) {
        console.error("Failed to create user:", createError);
        return new Response(
          JSON.stringify({ error: `Failed to create user: ${createError.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      userId = newUser.user.id;
    }
    
    // Create client role for this user
    try {
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: "client",
          client_id: client_id
        }, {
          onConflict: 'user_id,role',
          ignoreDuplicates: false
        });
      
      if (roleError) {
        console.warn("Could not create user role:", roleError.message);
        // Continue despite error, but log it
      }
    } catch (roleError) {
      console.warn("Error creating user role:", roleError);
      // Continue despite error, but log it
    }
    
    // Create AI agent entry for this client
    try {
      const { error: agentError } = await supabase
        .from("ai_agents")
        .insert([{
          client_id: client_id,
          name: agent_name,
          settings: {
            client_name: client_name,
            created_at: new Date().toISOString()
          }
        }]);
      
      if (agentError) {
        console.warn("Could not create AI agent entry:", agentError.message);
        // Continue despite error
      }
    } catch (agentError) {
      console.warn("Error creating AI agent:", agentError);
      // Continue despite error
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Client user account created/updated successfully",
        user_id: userId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error("Error in create-client-user function:", err);
    
    return new Response(
      JSON.stringify({ 
        error: err.message || "Failed to create client user" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
