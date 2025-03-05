
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface SetupConfirmationRequest {
  email: string;
  clientName: string;
  temporaryPassword: string;
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
    console.log("Setup confirmation email function started");
    
    // Validate Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("ERROR: Missing RESEND_API_KEY environment variable");
      throw new Error("Resend API key not configured");
    }
    
    console.log("Initializing Resend client");
    const resend = new Resend(resendApiKey);
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body parsed:", JSON.stringify(requestBody, null, 2));
    } catch (error) {
      console.error("Failed to parse request body:", error);
      throw new Error("Invalid JSON in request body");
    }
    
    // Extract and validate required fields
    const { email, clientName, temporaryPassword } = requestBody as SetupConfirmationRequest;
    
    if (!email || !clientName || !temporaryPassword) {
      const missingFields = [];
      if (!email) missingFields.push("email");
      if (!clientName) missingFields.push("clientName");
      if (!temporaryPassword) missingFields.push("temporaryPassword");
      
      console.error(`Missing required fields: ${missingFields.join(", ")}`);
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }
    
    console.log(`Sending setup confirmation to: ${email}`);
    
    // Generate the login URL
    const origin = req.headers.get("origin") || "https://welcome.chat";
    const loginUrl = `${origin}/client/auth`;
    
    // Email content with login link and temporary password
    const htmlContent = `
      <h1>Welcome to Welcome.Chat, ${clientName}!</h1>
      <p>Your account has been successfully set up.</p>
      <p>You can now access your AI assistant dashboard using the following credentials:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      <p><strong>Important:</strong> For security reasons, please change your password when you first log in.</p>
      <p><a href="${loginUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px;">Login to Dashboard</a></p>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${loginUrl}</p>
      <p>Thank you,<br>The Welcome.Chat Team</p>
    `;
    
    console.log("About to send email with Resend");
    
    // Send the email
    try {
      const { data, error } = await resend.emails.send({
        from: "Welcome.Chat <noreply@welcome.chat>",
        to: email,
        subject: "Welcome.Chat - Your Account is Ready",
        html: htmlContent
      });
      
      if (error) {
        console.error("Error from Resend API:", error);
        throw error;
      }
      
      console.log("Setup confirmation email sent successfully:", data);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Setup confirmation email sent successfully"
        }), 
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (sendError) {
      console.error("Error sending email with Resend:", sendError);
      throw new Error(`Failed to send email: ${sendError.message || sendError}`);
    }
  } catch (error: any) {
    console.error("Error in send-setup-confirmation function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send setup confirmation",
        details: typeof error === 'object' ? JSON.stringify(error) : 'Unknown error'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
