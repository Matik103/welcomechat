
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
    console.log("Create client user function started");
    
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables:", { 
        supabaseUrl: !!supabaseUrl, 
        supabaseServiceKey: !!supabaseServiceKey 
      });
      
      return new Response(
        JSON.stringify({ error: "Missing environment variables for Supabase client" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed successfully:", { 
        email: body.email,
        client_id: body.client_id,
        client_name: body.client_name,
        agent_name: body.agent_name
      });
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
      const missingFields = [];
      if (!email) missingFields.push("email");
      if (!password) missingFields.push("password");
      if (!client_id) missingFields.push("client_id");
      
      console.error("Missing required fields:", missingFields);
      
      return new Response(
        JSON.stringify({ error: `Required fields missing: ${missingFields.join(", ")}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Check if user already exists
    try {
      console.log("Checking if user exists:", email);
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
        try {
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
        } catch (updateError) {
          console.error("Exception updating user metadata:", updateError);
          return new Response(
            JSON.stringify({ error: `Exception updating user metadata: ${updateError.message || "Unknown error"}` }),
            { 
              status: 500, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      } else {
        // Create a new user
        console.log("Creating new user:", email);
        
        try {
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
        } catch (createError) {
          console.error("Exception creating user:", createError);
          return new Response(
            JSON.stringify({ error: `Exception creating user: ${createError.message || "Unknown error"}` }),
            { 
              status: 500, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      }
      
      // Create client role for this user
      try {
        console.log("Creating user role for user:", userId);
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
        console.log("Creating AI agent for client:", client_id);
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
      
      console.log("Client user creation successful");
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
      console.error("Error in user check/creation section:", err);
      return new Response(
        JSON.stringify({ 
          error: err.message || "Failed to create client user",
          details: err.toString()
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (err) {
    console.error("Unhandled error in create-client-user function:", err);
    
    return new Response(
      JSON.stringify({ 
        error: err.message || "Failed to create client user",
        details: err.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
