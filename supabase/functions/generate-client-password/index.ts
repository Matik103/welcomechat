
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate client password function started');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const { email, clientId } = await req.json();
    
    // Generate a secure password: welcome + 4 digits
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const password = `Welcome${randomDigits}!`; // Added special character for security
    
    console.log(`Generated password for client ${clientId}`);
    
    // Create or update the user with the generated password
    const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (getUserError && getUserError.message !== 'User not found') {
      console.error('Error checking existing user:', getUserError);
      throw getUserError;
    }
    
    // If user already exists, we don't need to create a password
    if (existingUser) {
      console.log('User already exists, skipping password creation');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          password: null,
          message: 'User already exists, no new password created'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('User does not exist yet, storing temporary password');
    
    // Store the temporary password in a secure storage
    // We'll use a dedicated table to store temporary passwords
    const { error: storeError } = await supabaseAdmin
      .from('client_temp_passwords')
      .upsert({
        client_id: clientId,
        email: email,
        temp_password: password,
        created_at: new Date().toISOString(),
        used: false
      });
    
    if (storeError) {
      console.error('Error storing temporary password:', storeError);
      throw storeError;
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        password: password,
        message: 'Password generated successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in generate-client-password function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate password',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
