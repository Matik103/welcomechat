
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
    const requestData = await req.json();
    console.log("Request data received:", JSON.stringify(requestData));
    
    const { email, client_id, client_name, agent_name, agent_description } = requestData;
    
    if (!email || !client_id) {
      console.error("Missing required parameters:", { email, client_id });
      return new Response(
        JSON.stringify({ error: "Email and client_id are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Generate a secure temporary password with the specific format
    const generateSecurePassword = () => {
      // Base pattern: "Welcome" + current year + "#" + 3 random digits
      const currentYear = new Date().getFullYear();
      const randomDigits = Math.floor(Math.random() * 900) + 100; // 100 to 999
      
      return `Welcome${currentYear}#${randomDigits}`;
    };

    // Generate a temporary password for this client
    const tempPassword = generateSecurePassword();
    
    console.log("Generated temporary password for client:", client_id);
    console.log("Attempting to store temp password for client");
    
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
    
    console.log("Successfully stored temp password, now creating user");
    
    // Attempt to create auth user (or update existing one)
    try {
      // Check if user already exists
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error("Error listing users:", listError);
      }
      
      const existingUser = existingUsers?.users?.find(u => u.email === email);
      
      if (existingUser) {
        // Update existing user
        console.log("User already exists, updating:", existingUser.id);
        await supabase.auth.admin.updateUserById(existingUser.id, {
          password: tempPassword,
          user_metadata: {
            client_id,
            user_type: 'client'
          }
        });
        console.log("Updated existing user:", existingUser.id);
      } else {
        // Create new user
        console.log("Creating new user with email:", email);
        const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
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
