
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

/**
 * Generates a temporary password for client accounts
 * Using the format "Welcome{YEAR}#{RANDOM}" that meets Supabase Auth requirements
 * @returns A randomly generated temporary password
 */
function generateClientTempPassword(): string {
  const currentYear = new Date().getFullYear();
  const randomDigits = Math.floor(Math.random() * 900) + 100; // 100-999
  
  return `Welcome${currentYear}#${randomDigits}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
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
          persistSession: false,
        },
        global: {
          headers: {
            'X-Client-Info': 'create-client-user-edge-function'
          }
        }
      }
    );
    
    // Parse the request body
    const body = await req.json();
    const { 
      email, 
      client_id, 
      client_name, 
      agent_name, 
      agent_description, 
      temp_password,
      update_only = false 
    } = body;
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    if (!client_id) {
      return new Response(
        JSON.stringify({ error: "Client ID is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log(`Creating user with Supabase Auth for client_id: ${client_id}, email: ${email}`);
    
    // Verify the client exists in ai_agents table
    const { data: agentData, error: agentError } = await supabase
      .from('ai_agents')
      .select('id, client_id, email')
      .eq('id', client_id)
      .single();
    
    if (agentError) {
      console.error("Error verifying client:", agentError);
      return new Response(
        JSON.stringify({ error: "Invalid client ID" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Ensure client_id is set in the ai_agents table
    if (!agentData.client_id || agentData.client_id !== client_id) {
      console.log("Client record doesn't have client_id set correctly. Setting client_id to:", client_id);
      
      const { error: updateClientIdError } = await supabase
        .from('ai_agents')
        .update({ client_id: client_id })
        .eq('id', client_id);
        
      if (updateClientIdError) {
        console.error("Error updating client_id:", updateClientIdError);
        // Continue anyway, but log the error
      } else {
        console.log("Successfully updated client_id in ai_agents table");
      }
    }
    
    // Check if user already exists by email
    const { data: existingUsers, error: listUsersError } = await supabase.auth.admin.listUsers();
    
    if (listUsersError) {
      console.error("Error listing users:", listUsersError);
      throw listUsersError;
    }
    
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    let userId;
    let actualPassword = temp_password;
    
    // If temp_password wasn't provided, generate one that meets Supabase requirements
    if (!actualPassword) {
      actualPassword = generateClientTempPassword();
      console.log("Generated welcome password format:", actualPassword);
    } else {
      console.log("Using provided temporary password");
    }
    
    if (existingUser) {
      console.log("Existing user found with email:", email);
      // Update existing user with client_id
      const { data: updatedUser, error: updateUserError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: actualPassword,
        email_confirm: true,
        user_metadata: {
          client_id: client_id,
          user_type: 'client'
        }
      });
      
      if (updateUserError) {
        console.error("Error updating user:", updateUserError);
        throw updateUserError;
      }
      
      userId = existingUser.id;
      console.log("Updated existing user with client_id:", client_id);
    } else if (!update_only) {
      console.log("No existing user found with email:", email, "Creating new user");
      // Create new user with our password and client_id in metadata
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        password: actualPassword,
        email_confirm: true, // Skip email verification
        user_metadata: {
          client_id: client_id,
          user_type: 'client'
        }
      });
      
      if (createUserError) {
        console.error("Error creating user:", createUserError);
        throw createUserError;
      }
      
      userId = newUser?.user?.id;
      console.log("Created new user with client_id:", client_id);
    } else {
      console.log("Update only flag set and no existing user found. Skipping user creation.");
    }
    
    if (userId) {
      // Ensure there's a user_role record for this user
      try {
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert({
            user_id: userId,
            role: "client",
            client_id: client_id
          }, { onConflict: 'user_id, role' });
          
        if (roleError) {
          console.error("Error setting user role:", roleError);
          // Continue anyway, the main user account is created
        } else {
          console.log("Successfully set user role for:", userId);
        }
      } catch (roleErr) {
        console.error("Exception setting user role:", roleErr);
        // Continue anyway, the main user account is created
      }
      
      // Make sure we have a password record for this client
      try {
        // First check if there's already a temp password for this client
        const { data: existingPasswords, error: checkError } = await supabase
          .from("client_temp_passwords")
          .select("id")
          .eq("agent_id", client_id)
          .limit(1);
        
        if (checkError) {
          console.error("Error checking existing temporary passwords:", checkError);
        } else if (existingPasswords && existingPasswords.length === 0) {
          // No existing password found, create a new one
          const { error: tempPasswordError } = await supabase
            .from("client_temp_passwords")
            .insert({
              email: email,
              temp_password: actualPassword,
              agent_id: client_id
            });
            
          if (tempPasswordError) {
            console.error("Error saving temporary password:", tempPasswordError);
            // Continue anyway
          } else {
            console.log("Saved temporary password for client_id:", client_id);
          }
        } else {
          console.log("Temporary password record already exists for client_id:", client_id);
        }
      } catch (passwordErr) {
        console.error("Exception handling temporary password:", passwordErr);
        // Continue anyway, the user account is created
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Client user created successfully",
        userId: userId,
        password: actualPassword,
        clientId: client_id
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
