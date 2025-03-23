
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.1";
import { Resend } from "npm:resend@2.0.0";

// Create a Supabase client with the Auth context of the function
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Use the API key from environment variables
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate that we have the API key before proceeding
    if (!resendApiKey) {
      console.error("RESEND_API_KEY environment variable is not set or empty");
      throw new Error("Email service configuration is missing (RESEND_API_KEY)");
    }

    // Parse the request body
    const body = await req.json();
    const { clientId, clientName, email, agentName, tempPassword } = body;
    
    console.log("Processing welcome email request:", { clientId, clientName, email, tempPassword: !!tempPassword });
    
    // Validate required parameters
    if (!clientId || !clientName || !email || !tempPassword) {
      console.error("Missing required parameters:", { clientId, clientName, email, tempPassword: !!tempPassword });
      throw new Error("Missing required parameters: clientId, clientName, email and tempPassword are required");
    }

    console.log("Processing welcome email for:", { clientId, clientName, email });
    
    const agentInfo = agentName ? ` with AI assistant "${agentName}"` : '';
    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://welcomeai.io";
    const loginLink = `${publicSiteUrl}/client/auth`;

    console.log("Sending welcome email with login link:", loginLink);

    // Save the temporary password in the database (again, just to be sure)
    const { error: passwordError } = await supabase
      .from("client_temp_passwords")
      .insert({
        agent_id: clientId,
        email: email,
        temp_password: tempPassword
      });
      
    if (passwordError) {
      console.error("Error saving temporary password:", passwordError);
      // Continue even if password save fails
    }

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: "Welcome.Chat <admin@welcome.chat>",
      to: email,
      subject: "Welcome to Welcome.Chat - Your Account Details",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 25px; border-radius: 8px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Welcome.Chat!</h1>
          </div>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">Hello ${clientName},</p>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">Your AI assistant account${agentInfo} has been created and is ready for configuration. Here are your login credentials:</p>
          
          <div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #4f46e5;">
            <p style="color: #333333; font-weight: 600; margin-bottom: 8px; font-size: 16px;">Email Address:</p>
            <p style="color: #4f46e5; margin-top: 0; margin-bottom: 20px; font-size: 16px;">${email}</p>
            
            <p style="color: #333333; font-weight: 600; margin-bottom: 8px; font-size: 16px;">Temporary Password:</p>
            <p style="color: #4f46e5; font-family: monospace; font-size: 18px; background-color: #eef2ff; padding: 12px; border-radius: 6px; margin-top: 0; letter-spacing: 0.5px; text-align: center;">${tempPassword}</p>
          </div>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">To get started:</p>
          <ol style="color: #333333; font-size: 16px; padding-left: 20px; line-height: 1.8;">
            <li>Click the "Sign In" button below</li>
            <li>Enter your email and temporary password exactly as shown above</li>
            <li>You'll be taken directly to your client dashboard</li>
            <li>Configure your AI assistant's settings</li>
          </ol>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${loginLink}" 
               style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.25);">
              Sign In
            </a>
          </div>
          
          <div style="border-top: 1px solid #e0e0e0; margin-top: 35px; padding-top: 25px;">
            <p style="color: #333333; font-weight: 600; font-size: 16px;">Security Notice:</p>
            <p style="color: #555555; font-size: 14px; line-height: 1.6;">This invitation will expire in 48 hours. For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
          </div>
          
          <p style="color: #333333; font-size: 16px; margin-top: 30px; line-height: 1.6;">Best regards,<br>The Welcome.Chat Team</p>
          
          <div style="text-align: center; margin-top: 35px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 25px;">
            © ${new Date().getFullYear()} Welcome.Chat. All rights reserved.
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Email sending error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    // Log client activity for email sent
    await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: "client_updated",
        description: `Welcome email sent to ${clientName}`,
        metadata: { 
          email_type: "welcome_email",
          recipient_email: email,
          temp_password_length: tempPassword.length
        }
      });

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-welcome-email:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        details: error.stack || "No stack trace available"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
