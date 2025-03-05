
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
    
    // Generate the setup URL - make sure this is the actual production URL, not preview
    // This URL will be accessible by clients to set up their password
    const origin = req.headers.get("origin") || "https://welcome.chat";
    const setupUrl = `${origin}/client/setup?id=${clientId}`;
    
    console.log(`Setup URL: ${setupUrl}`);
    
    // Email content with setup link
    const htmlContent = `
      <h1>Welcome to Welcome.Chat, ${clientName}!</h1>
      <p>Your account has been created. Click the link below to complete your setup:</p>
      <p><a href="${setupUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px;">Complete Setup</a></p>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${setupUrl}</p>
      <p>Thank you,<br>The Welcome.Chat Team</p>
    `;
    
    // Send the email
    const { data, error } = await resend.emails.send({
      from: "Welcome.Chat <noreply@welcome.chat>",
      to: email,
      subject: "Welcome to Welcome.Chat - Complete Your Setup",
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
