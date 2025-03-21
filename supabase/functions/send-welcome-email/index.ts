
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

    // Save the temporary password in the database
    const { error: passwordError } = await supabase
      .from("client_temp_passwords")
      .insert({
        agent_id: clientId,
        email: email,
        temp_password: tempPassword
      });
      
    if (passwordError) {
      console.error("Error saving temporary password:", passwordError);
      throw new Error("Failed to save client credentials");
    }

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: "Welcome.Chat <admin@welcome.chat>",
      to: email,
      subject: "Welcome to Welcome.Chat - Your Account Details",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4f46e5;">Welcome to Welcome.Chat!</h1>
          </div>
          
          <p>Hello ${clientName},</p>
          
          <p>Your AI assistant account${agentInfo} has been created and is ready for configuration. Here are your login credentials:</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email Address:</strong></p>
            <p style="color: #4f46e5;">${email}</p>
            
            <p><strong>Temporary Password:</strong></p>
            <p style="color: #4f46e5; font-family: monospace; font-size: 16px;">${tempPassword}</p>
          </div>
          
          <p>To get started:</p>
          <ol>
            <li>Click the "Sign In" button below</li>
            <li>Enter your email and temporary password exactly as shown above</li>
            <li>You'll be taken to your client dashboard</li>
            <li>Configure your AI assistant's settings</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginLink}" 
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Sign In
            </a>
          </div>
          
          <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
            <p><strong>Security Notice:</strong></p>
            <p>This invitation will expire in 48 hours. For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
          </div>
          
          <p>Best regards,<br>The Welcome.Chat Team</p>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
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
