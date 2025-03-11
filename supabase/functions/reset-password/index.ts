
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

    console.log(`Attempting to update user password with token`);

    // First try using the token directly as a user ID
    let result;
    try {
      result = await supabase.auth.admin.updateUserById(
        token,
        { password }
      );
    } catch (error) {
      console.error('Error using token as user ID:', error);
      // If that fails, try to verify and use the token as a recovery token
      try {
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        });
        
        if (verifyError) throw verifyError;
        
        // If verified, update the password for the user
        if (verifyData?.user?.id) {
          result = await supabase.auth.admin.updateUserById(
            verifyData.user.id,
            { password }
          );
        } else {
          throw new Error('Could not verify token');
        }
      } catch (verifyError) {
        console.error('Error verifying token:', verifyError);
        throw verifyError;
      }
    }
    
    if (result.error) {
      console.error('Error resetting password:', result.error);
      
      // Return more specific error information
      let errorMessage = result.error.message;
      let errorCode = result.error.status || 400;
      
      if (result.error.message.includes('expired') || result.error.message.includes('invalid')) {
        errorMessage = 'Password reset link has expired or is invalid. Please request a new one.';
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
      JSON.stringify({ 
        success: true,
        message: 'Password has been updated successfully'
      }),
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
