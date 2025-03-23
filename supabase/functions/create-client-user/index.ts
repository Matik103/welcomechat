
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
    const body = await req.json();
    const { email, client_id, client_name, agent_name, agent_description, temp_password } = body;
    
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
    let actualPassword = temp_password;
    
    // If temp_password wasn't provided, generate one that meets Supabase requirements
    if (!actualPassword) {
      // Using the standard format for passwords
      actualPassword = generateWelcomePassword();
      console.log("Generated welcome password:", actualPassword);
    } else {
      console.log("Using provided temporary password");
    }
    
    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateUserError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: actualPassword,
        email_confirm: true,
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
      // Create new user with our password
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        password: actualPassword,
        email_confirm: true, // Skip email verification
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
      
      // Also save the temporary password in the client_temp_passwords table
      try {
        const { error: tempPasswordError } = await supabase
          .from("client_temp_passwords")
          .insert({
            agent_id: client_id,
            email: email,
            temp_password: actualPassword,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiry
          });
          
        if (tempPasswordError) {
          console.error("Error saving temporary password:", tempPasswordError);
          // Continue anyway, the user account is created
        } else {
          console.log("Saved temporary password for client:", client_id);
        }
      } catch (passwordErr) {
        console.error("Exception saving temporary password:", passwordErr);
        // Continue anyway, the user account is created
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Client user created successfully",
        userId: userId,
        password: actualPassword
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

/**
 * Generates a welcome password in the format "Welcome2024#123"
 * This format is more memorable for users while still meeting security requirements
 */
function generateWelcomePassword(): string {
  const currentYear = new Date().getFullYear();
  const randomDigits = Math.floor(Math.random() * 900) + 100; // 100-999
  
  return `Welcome${currentYear}#${randomDigits}`;
}
