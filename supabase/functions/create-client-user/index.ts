
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface CreateUserRequest {
  email: string;
  password: string;
  client_id: string;
  client_name: string;
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
    console.log("Create client user function started");
    
    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const { email, password, client_id, client_name }: CreateUserRequest = await req.json();
    
    // Validate required parameters
    if (!email || !password || !client_id) {
      throw new Error("Missing required parameters: email, password, or client_id");
    }
    
    console.log(`Creating user for client ${client_name} (${client_id}) with email ${email}`);
    
    // Create the user with admin privileges
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email to allow immediate login
      user_metadata: { 
        client_id,
        client_name,
        role: "client"
      }
    });
    
    if (userError) {
      console.error("Error creating user:", userError);
      throw userError;
    }
    
    const userId = userData.user.id;
    console.log("User created successfully:", userId);
    
    // Create user role entry
    try {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "client",
          client_id: client_id
        });
        
      if (roleError) {
        console.error("Error creating user role:", roleError);
        // Continue despite error, as user was created successfully
      } else {
        console.log("User role created successfully");
      }
    } catch (roleError) {
      console.error("Failed to create user role:", roleError);
      // Continue despite error, as user was created successfully
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in create-client-user function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create client user"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
