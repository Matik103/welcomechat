
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
    
    // Check if user already exists with this email
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers({
      filter: {
        email: email
      }
    });
    
    if (checkError) {
      console.error("Error checking existing users:", checkError);
      throw checkError;
    }
    
    let userId: string;
    
    if (existingUsers && existingUsers.users.length > 0) {
      console.log("User with this email already exists, updating metadata");
      const existingUser = existingUsers.users[0];
      userId = existingUser.id;
      
      // Update the existing user metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { 
          client_id,
          client_name,
          role: "client"
        }
      });
      
      if (updateError) {
        console.error("Error updating existing user:", updateError);
        throw updateError;
      }
      
      console.log("Updated existing user metadata:", userId);
    } else {
      // Create a new user
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
      
      userId = userData.user.id;
      console.log("User created successfully:", userId);
    }
    
    // Create user role entry
    try {
      // Check if the role entry already exists
      const { data: existingRoles, error: roleCheckError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("client_id", client_id);
        
      if (roleCheckError) {
        console.error("Error checking existing role:", roleCheckError);
      }
      
      if (!existingRoles || existingRoles.length === 0) {
        console.log("Creating new user role entry");
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "client",
            client_id: client_id
          });
          
        if (roleError) {
          console.error("Error creating user role:", roleError);
          // Continue despite error, as user was created/updated successfully
        } else {
          console.log("User role created successfully");
        }
      } else {
        console.log("User role entry already exists, skipping creation");
      }
    } catch (roleError) {
      console.error("Failed to create user role:", roleError);
      // Continue despite error, as user was created/updated successfully
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
