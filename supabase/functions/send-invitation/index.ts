
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  role_type: 'admin' | 'client';
  url: string;
  clientName?: string;
  clientId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("PROJECT_URL") || "",
      Deno.env.get("SERVICE_ROLE_KEY") || ""
    );

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
    
    console.log(`Admin verified: ${user.email}`);

    const { email, role_type, url, clientName, clientId }: InvitationEmailRequest = await req.json();
    console.log(`Processing invitation for ${role_type}: ${clientName || email}, URL: ${url}`);

    // Initialize Resend client
    const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");

    // Send the email with Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Welcome.Chat <admin@welcome.chat>",
      to: email,
      subject: `You've been invited to Welcome.Chat as ${role_type}`,
      reply_to: "admin@welcome.chat",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;">
              <h1 style="color: #4F46E5; margin-top: 0;">Welcome to Welcome.Chat!</h1>
              <p>Hello ${clientName || ''},</p>
              <p>You have been invited to join <strong>Welcome.Chat</strong> as a ${role_type}.</p>
              <p>Click the link below to set up your account:</p>
              <a href="${url}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0; font-weight: bold;">Accept Invitation</a>
              <p style="color: #666; font-size: 14px;">This invitation will expire in 48 hours. If you did not expect this invitation, please ignore this email.</p>
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

    console.log("Email sent successfully to", email);

    // Log the email invitation
    await supabase.from('email_logs').insert({
      sent_by: user.email,
      sent_to: email,
      type: 'invitation',
      status: 'sent',
      role_type: role_type,
      client_id: clientId || null,
      metadata: {
        url: url,
        clientName: clientName || null
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
    console.error("Failed to send invitation:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to send invitation email",
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
};

serve(handler);
