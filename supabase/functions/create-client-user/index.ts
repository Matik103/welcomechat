
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
    const { email, client_id, client_name, agent_name, agent_description } = await req.json();
    
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
    let generatedPassword = "";
    
    // Let Supabase Auth handle password generation for security
    if (existingUser) {
      // Update existing user with a new random password
      const { data: updatedUser, error: updateUserError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: null, // null tells Supabase to generate a random password
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
      
      // Generate a password for this existing user
      const { data: passwordData, error: passwordError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${supabaseUrl}/auth/callback`
        }
      });
      
      if (passwordError) {
        console.error("Error generating recovery link:", passwordError);
        throw passwordError;
      }
      
      // Extract password from the hashed portion of the URL
      if (passwordData && passwordData.properties && passwordData.properties.hashed_token) {
        // Use first 12 chars of the hashed token as the password
        generatedPassword = passwordData.properties.hashed_token.slice(0, 12);
        // Ensure it includes uppercase, lowercase, number and special char
        generatedPassword = ensurePasswordComplexity(generatedPassword);
      } else {
        // Fallback to generating a password manually
        generatedPassword = generateComplexPassword();
      }
      
      // Update the user with our controlled password
      const { error: resetError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: generatedPassword
      });
      
      if (resetError) {
        console.error("Error setting password for existing user:", resetError);
        throw resetError;
      }
    } else {
      // Generate a secure password that meets Supabase requirements
      generatedPassword = generateComplexPassword();
      
      // Create new user with our controlled password
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        password: generatedPassword,
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
            agent_id: client_id, // Use agent_id to match the schema
            email: email,
            temp_password: generatedPassword,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
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

/**
 * Generates a complex password that meets Supabase Auth requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
function generateComplexPassword(): string {
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // excluding I and O
  const lowercaseChars = 'abcdefghijkmnpqrstuvwxyz'; // excluding l
  const numbers = '23456789'; // excluding 0 and 1
  const specialChars = '!@#$%^&*';
  
  // Ensure at least one character from each required type
  let password = '';
  password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
  password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Add more random characters for a total length of 12
  const allChars = uppercaseChars + lowercaseChars + numbers + specialChars;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the characters to make the pattern less predictable
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Ensures a password meets complexity requirements by adding missing character types
 */
function ensurePasswordComplexity(basePassword: string): string {
  let password = basePassword;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  // Add missing character types
  if (!hasUppercase) password += 'A';
  if (!hasLowercase) password += 'a';
  if (!hasNumber) password += '7';
  if (!hasSpecial) password += '!';
  
  // Ensure the password is at least 8 characters
  while (password.length < 12) {
    password += 'Aa7!'.charAt(Math.floor(Math.random() * 4));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}
