
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
    
    // Use the provided temp_password or generate a new one if not provided
    const clientPassword = temp_password || (() => {
      // Generate a secure password format compatible with Supabase requirements
      const currentYear = new Date().getFullYear();
      const randomDigits = Math.floor(Math.random() * 900) + 100; // 100-999
      const specialChars = ['@', '#', '$', '%', '&', '*', '!'];
      const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
      
      // Format: Welcome{Year}{SpecialChar}{3digits} - e.g., Welcome2025#123
      return `Welcome${currentYear}${randomSpecial}${randomDigits}`;
    })();

    console.log(`Using password for client ${client_id}: ${clientPassword}`);
    
    // If no temp_password was provided, store it in the database
    if (!temp_password) {
      const { error: tempPasswordError } = await supabase
        .from("client_temp_passwords")
        .insert({
          agent_id: client_id,
          email: email,
          temp_password: clientPassword
        });

      if (tempPasswordError) {
        console.error("Error saving temporary password:", tempPasswordError);
        throw tempPasswordError;
      }
    }
    
    console.log("Successfully stored or used temp password, now creating user");
    
    // Attempt to create auth user (or update existing one)
    try {
      // Check if user already exists
      const { data: existingUsers, error: listUsersError } = await supabase.auth.admin.listUsers();
      
      if (listUsersError) {
        console.error("Error listing users:", listUsersError);
        throw listUsersError;
      }
      
      const existingUser = existingUsers?.users?.find(u => u.email === email);
      
      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error: updateUserError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: clientPassword,
          user_metadata: {
            client_id,
            user_type: 'client'
          }
        });
        
        if (updateUserError) {
          console.error("Error updating user:", updateUserError);
          throw updateUserError;
        }
        
        console.log("Updated existing user:", existingUser.id);
      } else {
        // Create new user
        const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
          email,
          password: clientPassword,
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
        
        console.log("Created new user:", newUser?.user?.id);
      }
      
      // Ensure there's a user_role record for this user
      const userAccount = existingUser || 
        (await supabase.auth.admin.listUsers()).data?.users?.find(u => u.email === email);
      
      if (userAccount) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert({
            user_id: userAccount.id,
            role: "client",
            client_id: client_id
          });
          
        if (roleError) {
          console.error("Error setting user role:", roleError);
          // Continue, we've still created the user and temp password
        } else {
          console.log("Successfully set user role for:", userAccount.id);
        }
      }
    } catch (authError) {
      console.error("Auth operation error:", authError);
      // Continue, as we still created the client record and temp password
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Client user setup successfully",
        temp_password: clientPassword
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
