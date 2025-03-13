import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-auth, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

interface InvitationRequest {
  clientId: string;
  email: string;
  clientName: string;
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
    console.log("Send client invitation function started");
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body received:", JSON.stringify(requestBody));
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      throw new Error("Invalid request format");
    }
    
    const { clientId, email, clientName } = requestBody as InvitationRequest;
    
    if (!clientId || !email) {
      console.error("Missing required parameters:", { clientId, email });
      throw new Error("Missing required parameters: clientId and email are required");
    }
    
    console.log(`Sending invitation to client: ${clientName || 'Unknown'} (${email}), ID: ${clientId}`);
    
    // Generate the dashboard URL
    const origin = req.headers.get("origin") || "https://admin.welcome.chat";
    
    // Initialize Supabase admin client
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
    
    if (!supabaseAdmin) {
      console.error("Failed to initialize Supabase admin client");
      throw new Error("Failed to initialize Supabase client");
    }

    // Verify environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing required environment variables:", {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceRoleKey: !!serviceRoleKey
      });
      throw new Error("Missing required environment variables");
    }
    
    // Custom email template options with proper redirect URL
    const emailOptions = {
      data: {
        client_id: clientId,
        client_name: clientName,
        origin: origin,
        app_name: "Welcome.Chat",
        invitation_url: `${origin}/client/view`
      },
      redirectTo: `${origin}/client/view`,
      // Do not include email template here as it's configured in Supabase dashboard
    };
    
    // Send Supabase built-in invitation
    console.log("Sending invitation via Resend with options:", {
      email,
      clientId,
      clientName,
      redirectTo: emailOptions.redirectTo,
      origin: origin,
      env: {
        hasResendKey: !!Deno.env.get('RESEND_API_KEY'),
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceRoleKey: !!serviceRoleKey
      }
    });
    
    try {
      // First check if user already exists
      const { data: existingUser, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      
      if (userError) {
        console.error("Error checking existing user:", {
          error: userError.message,
          email
        });
      }
      
      if (existingUser) {
        console.log("User already exists:", {
          email,
          userId: existingUser.id
        });
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "User already exists",
            details: { email }
          }), 
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Attempt to send invitation
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, emailOptions);
      
      if (inviteError) {
        console.error("Supabase invitation failed:", {
          error: inviteError.message,
          code: inviteError.status,
          details: inviteError,
          emailOptions
        });
        throw inviteError;
      }

      // Verify the invite was created
      if (!inviteData) {
        console.error("No invite data returned", {
          email,
          clientName,
          emailOptions
        });
        throw new Error("Failed to create invitation - no data returned");
      }
      
      console.log("Supabase invitation sent successfully:", {
        inviteData,
        email,
        clientName,
        redirectUrl: emailOptions.redirectTo
      });
      
      // Return success
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Invitation email sent successfully",
          data: inviteData
        }), 
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (inviteError) {
      console.error("Failed to send invitation:", inviteError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: inviteError.message || "Failed to send invitation",
          details: inviteError
        }), 
        {
          status: 200, // Keep 200 to handle in frontend
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error("Error in send-client-invitation function:", error);
    
    // Always return 200 status to avoid frontend throwing non-2xx errors
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invitation",
        success: false
      }), 
      {
        status: 200, // Changed from 500 to 200 to avoid non-2xx error
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
