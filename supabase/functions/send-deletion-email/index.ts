
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface DeletionEmailRequest {
  clientId: string;
  clientName: string;
  email: string;
  agentName?: string;
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
    console.log("Send deletion email function started");
    
    // Use the Resend API key from environment variables - fallback to direct value for testing
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "re_36V5aruC_9aScEQmCQqnYzGtuuhg1WFN2";
    if (!resendApiKey) {
      console.error("ERROR: Missing RESEND_API_KEY environment variable");
      return new Response(
        JSON.stringify({ error: "Resend API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log("Initializing Resend client with API key");
    const resend = new Resend(resendApiKey);
    
    // Parse request body
    let body: DeletionEmailRequest;
    try {
      body = await req.json();
      console.log("Request body parsed successfully:", { 
        clientId: body.clientId,
        clientName: body.clientName, 
        email: body.email
      });
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const { clientId, clientName, email } = body;
    
    // Validate required parameters
    if (!clientId || !clientName || !email) {
      const missingParams = [];
      if (!clientId) missingParams.push("clientId");
      if (!clientName) missingParams.push("clientName");
      if (!email) missingParams.push("email");
      
      console.error("Missing required parameters:", missingParams.join(", "));
      return new Response(
        JSON.stringify({ error: `Missing required parameters: ${missingParams.join(", ")}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Create recovery URL (this would typically point to a recovery page)
    const recoveryUrl = `${req.headers.get("origin") || "https://welcomechat.ai"}/client/recovery?id=${clientId}`;
    
    // Calculate the expiration date (30 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    const formattedDate = expirationDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Prepare email content with a professional template
    const emailSubject = `Important: Your Welcome.Chat Account is Scheduled for Deletion`;
    
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <title>Account Deletion Notice</title>
    </head>
    <body style="background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background-color: #4f46e5; padding: 30px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Account Deletion Notice</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px;">
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hello ${clientName},</p>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">We're writing to inform you that your Welcome.Chat account has been scheduled for deletion. If this was not intended or if you wish to recover your account, you have 30 days to take action.</p>
          
          <!-- Important Info Box -->
          <div style="background-color: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0 0 10px; color: #c2410c; font-weight: 600; font-size: 16px;">Important Information:</p>
            <ul style="color: #4a5568; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Your account will be permanently deleted on <strong>${formattedDate}</strong></li>
              <li style="margin-bottom: 8px;">All associated data will be permanently removed</li>
              <li style="margin-bottom: 8px;">This action cannot be undone after the 30-day period</li>
            </ul>
          </div>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">If you wish to recover your account, please click the button below or contact our support team directly at <a href="mailto:support@welcomechat.ai" style="color: #4f46e5; text-decoration: none;">support@welcomechat.ai</a>.</p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${recoveryUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Recover My Account</a>
          </div>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 30px 0 0;">If you intended to delete your account, no further action is required.</p>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 20px 0 0;">Thank you for your attention to this matter.</p>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 20px 0 0;">Best regards,<br>The Welcome.Chat Team</p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 14px; margin: 0;">© ${new Date().getFullYear()} Welcome.Chat. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Send the email
    try {
      console.log("Attempting to send email via Resend to:", email);
      
      const { data, error } = await resend.emails.send({
        from: "Welcome.Chat <admin@welcome.chat>",
        to: [email],
        subject: emailSubject,
        html: emailHtml
      });
      
      if (error) {
        console.error("Resend API error:", error);
        return new Response(
          JSON.stringify({ error: error.message || "Failed to send email" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      console.log("Email sent successfully:", data);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          data: data
        }), 
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (sendError) {
      console.error("Error sending email:", sendError);
      return new Response(
        JSON.stringify({ error: sendError.message || "Failed to send email" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  } catch (error: any) {
    console.error("Error in send-deletion-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to process deletion email request"
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
