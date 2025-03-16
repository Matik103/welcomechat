
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ClientInvitationRequest {
  email: string;
  clientName: string;
  clientId: string;
  setupUrl: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Initializing client invitation process");
    
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("PROJECT_URL") || "";
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables: PROJECT_URL or SERVICE_ROLE_KEY");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify admin permissions
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    // Get user from auth header and verify admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Authentication error:", userError);
      throw new Error('Authentication failed');
    }
    
    // Verify the user has admin role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
      
    if (rolesError || !roles) {
      console.error("Admin verification error:", rolesError);
      throw new Error('Unauthorized: Admin role required');
    }
    
    // Parse request body
    const { email, clientName, clientId, setupUrl }: ClientInvitationRequest = await req.json();
    
    if (!email || !clientName || !clientId || !setupUrl) {
      throw new Error("Missing required fields: email, clientName, clientId, or setupUrl");
    }
    
    console.log(`Processing client invitation for: ${clientName} (${email})`);
    
    // Initialize Resend client
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    
    const resend = new Resend(resendApiKey);
    
    // Send the email with Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Welcome.Chat <admin@welcome.chat>",
      to: email,
      subject: `Welcome to ${clientName}'s AI Assistant Dashboard`,
      reply_to: "admin@welcome.chat",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;">
              <h1 style="color: #4F46E5; margin-top: 0;">Welcome to Your AI Assistant Dashboard!</h1>
              <p>Hello,</p>
              <p>Your AI Assistant Dashboard for <strong>${clientName}</strong> has been set up.</p>
              <p>Click the link below to complete your account setup:</p>
              <a href="${setupUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0; font-weight: bold;">Complete Setup</a>
              <p style="color: #666; font-size: 14px;">This setup link will expire in 48 hours. If you did not expect this invitation, please ignore this email.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                <p>&copy; 2024 Welcome.Chat. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (emailError) {
      console.error("Email sending failed:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    console.log("Client invitation email sent successfully to", email);

    // Log the email invitation
    await supabase.from('email_logs').insert({
      sent_by: user.email,
      sent_to: email,
      type: 'client_invitation',
      status: 'sent',
      role_type: 'client',
      client_id: clientId,
      metadata: {
        url: setupUrl,
        clientName: clientName
      }
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error("Failed to send client invitation:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to send client invitation email",
        details: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
