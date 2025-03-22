
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables for Supabase client");
      throw new Error("Missing environment variables for Supabase client");
    }
    
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            'X-Client-Info': 'create-client-user-edge-function'
          }
        }
      }
    );
    
    // Parse the request body
    const { email, client_id, client_name, agent_name, agent_description, temp_password } = await req.json();
    
    if (!email || !client_id) {
      return new Response(
        JSON.stringify({ error: "Email and client_id are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log(`Creating user with Supabase Auth for client ${client_id}: ${email}`);
    
    // Check if user already exists
    const { data: existingUsers, error: listUsersError } = await supabase.auth.admin.listUsers();
    
    if (listUsersError) {
      console.error("Error listing users:", listUsersError);
      throw listUsersError;
    }
    
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    let userId;
    // Generate password if not provided
    const generatedPassword = temp_password || (
      Math.random().toString(36).slice(-10) + 
      Math.random().toString(36).toUpperCase().slice(-2) + 
      String(Math.floor(Math.random() * 10)) +
      "!"
    );
    
    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateUserError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: generatedPassword,
        user_metadata: {
          client_id,
          user_type: 'client'
        }
      });
      
      if (updateUserError) {
        console.error("Error updating user:", updateUserError);
        throw updateUserError;
      }
      
      userId = existingUser.id;
      console.log("Updated existing user:", userId);
    } else {
      // Create new user with provided or generated password
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          client_id,
          user_type: 'client'
        }
      });
      
      if (createUserError) {
        console.error("Error creating user:", createUserError);
        throw createUserError;
      }
      
      userId = newUser?.user?.id;
      console.log("Created new user:", userId);
    }
    
    if (userId) {
      // Ensure there's a user_role record for this user
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: "client",
          client_id: client_id
        });
        
      if (roleError) {
        console.error("Error setting user role:", roleError);
        // Continue anyway, the main user account is created
      } else {
        console.log("Successfully set user role for:", userId);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Client user created successfully",
        userId: userId,
        password: generatedPassword
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
