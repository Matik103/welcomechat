
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
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
    
    // Validate Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("ERROR: Missing RESEND_API_KEY environment variable");
      throw new Error("Resend API key not configured");
    }
    
    console.log("Initializing Resend client");
    const resend = new Resend(resendApiKey);
    
    // Parse request body
    const { clientId, email, clientName }: InvitationRequest = await req.json();
    console.log(`Sending invitation to client: ${clientName} (${email})`);
    
    // Generate the dashboard URL - where clients will set up their password
    const origin = req.headers.get("origin") || "https://welcome.chat";
    const dashboardUrl = `${origin}/client/dashboard?id=${clientId}`;
    
    console.log(`Dashboard URL: ${dashboardUrl}`);
    
    // Updated email content with dashboard link and clear password setup instructions
    const htmlContent = `
      <h1>Welcome to Welcome.Chat, Your Agent!</h1>
      <p>Your account has been created. Click the link below to access your dashboard:</p>
      <p><a href="${dashboardUrl}" style="display: inline-block; background-color: #6366F1; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-family: Arial, sans-serif;">Access Your Dashboard</a></p>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${dashboardUrl}</p>
      <p><strong>Important:</strong> When you first access your dashboard, you'll need to set up your password. Look for the password setup option in your account settings.</p>
      <p>Thank you,<br>The Welcome.Chat Team</p>
    `;
    
    // Send the email
    const { data, error } = await resend.emails.send({
      from: "Welcome.Chat <noreply@welcome.chat>",
      to: email,
      subject: "Welcome to Welcome.Chat - Access Your Dashboard",
      html: htmlContent
    });
    
    if (error) {
      console.error("Error from Resend API:", error);
      throw error;
    }
    
    console.log("Invitation email sent successfully:", data);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation email sent successfully"
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in send-client-invitation function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invitation"
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
