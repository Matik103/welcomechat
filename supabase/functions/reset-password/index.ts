
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting reset-password function');
    
    // Initialize the Supabase client with the service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { token, password } = await req.json()
    
    if (!token || !password) {
      console.error('Missing token or password in request');
      return new Response(
        JSON.stringify({ 
          error: 'Token and password are required',
          success: false 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log(`Attempting to reset password for user token: ${token.substring(0, 10)}...`);

    // Update user with the new password
    const { error } = await supabase.auth.admin.updateUserById(
      token,
      { password }
    )
    
    if (error) {
      console.error('Error resetting password:', error);
      
      // Return more specific error information
      let errorMessage = error.message;
      let errorCode = error.status || 400;
      
      if (error.message.includes('expired')) {
        errorMessage = 'Password reset link has expired. Please request a new one.';
        errorCode = 403;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          code: errorCode,
          success: false 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: errorCode
        }
      )
    }
    
    console.log('Password reset successfully');
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Unexpected error in reset-password:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
