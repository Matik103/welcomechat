
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
    
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    // Parse the request body
    const { email, client_id, client_name, agent_name, agent_description, logo_url, logo_storage_path } = await req.json();
    
    if (!email || !client_id) {
      return new Response(
        JSON.stringify({ error: "Email and client_id are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Generate a secure temporary password
    const generateSecurePassword = () => {
      const length = 12;
      const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let password = "";
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
      }
      return password;
    };

    // Generate a temporary password for this client
    const tempPassword = generateSecurePassword();
    
    // Store the temporary password in the database using service role
    const { error: tempPasswordError } = await supabase
      .from("client_temp_passwords")
      .insert({
        agent_id: client_id,
        email: email,
        temp_password: tempPassword
      });

    if (tempPasswordError) {
      console.error("Error saving temporary password:", tempPasswordError);
      throw tempPasswordError;
    }
    
    // Attempt to create auth user (or update existing one)
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);
      
      if (existingUser) {
        // Update existing user
        await supabase.auth.admin.updateUserById(existingUser.id, {
          password: tempPassword,
          user_metadata: {
            client_id,
            user_type: 'client'
          }
        });
      } else {
        // Create new user
        await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            client_id,
            user_type: 'client'
          }
        });
      }
      
      // Ensure there's a user_role record for this user
      const userAccount = existingUser || 
        (await supabase.auth.admin.listUsers()).data?.users?.find(u => u.email === email);
      
      if (userAccount) {
        await supabase
          .from("user_roles")
          .upsert({
            user_id: userAccount.id,
            role: "client",
            client_id: client_id
          });
      }
    } catch (authError) {
      console.error("Auth operation error:", authError);
      // Continue, as we still created the client record
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Client user setup successfully",
        temp_password: tempPassword
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
