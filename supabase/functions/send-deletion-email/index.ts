import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  const resend = new Resend(resendApiKey);

  try {
    console.log("Function invoked with method:", req.method);
    
    const body: DeletionEmailRequest = await req.json();
    console.log("Received request body:", body);

    const { clientId, clientName, email, agentName } = body;

    if (!clientId || !clientName || !email) {
      console.error("Missing required parameters:", { clientId, clientName, email });
      throw new Error("Missing required parameters");
    }

    // Use Resend for email
    try {
      const agentInfo = agentName ? ` and your AI assistant "${agentName}"` : '';
      
      const { data, error: emailError } = await resend.emails.send({
        from: "Welcome.Chat <admin@welcome.chat>",
        to: email,
        subject: "Account Deletion Notice",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          </head>
          <body style="background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background-color: #4299e1; padding: 30px 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Account Deletion Notice</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px;">
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Dear ${clientName},</p>
                
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">As requested, your account${agentInfo} has been scheduled for deletion. The deletion will be completed in 30 days.</p>
                
                <div style="border-left: 4px solid #f6ad55; background-color: #fffaf0; padding: 15px; margin: 30px 0; color: #744210; font-size: 14px; line-height: 1.6;">
                  <p style="margin: 0 0 10px;"><strong>Important Information:</strong></p>
                  <p style="margin: 0;">If this deletion was requested in error, please contact our support team immediately to cancel the deletion process. After 30 days, all your data will be permanently deleted and cannot be recovered.</p>
                </div>
                
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 30px 0 0;">Best regards,<br>The Welcome.Chat Team</p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; font-size: 14px; margin: 0;">© ${new Date().getFullYear()} Welcome.Chat. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (emailError) {
        throw new Error(`Error sending email: ${emailError.message}`);
      }

      console.log("Email sent successfully", data);
    } catch (error: any) {
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Deletion email sent successfully"
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Error in send-deletion-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send deletion email",
        details: error.stack
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
