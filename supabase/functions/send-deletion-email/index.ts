
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface DeletionEmailRequest {
  clientId: string;
  clientName: string;
  email: string;
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
    console.log("Function invoked with method:", req.method);
    
    const body: DeletionEmailRequest = await req.json();
    console.log("Received request body:", body);

    const { clientId, clientName, email } = body;

    if (!clientId || !clientName || !email) {
      console.error("Missing required parameters:", { clientId, clientName, email });
      throw new Error("Missing required parameters");
    }

    console.log("Sending deletion email to:", email);
    
    const { data, error: emailError } = await resend.emails.send({
      from: "AI Assistant Admin <onboarding@resend.dev>",
      to: [email],
      subject: "Account Deletion Notice",
      html: `
        <h1>Account Deletion Notice</h1>
        <p>Dear ${clientName},</p>
        <p>As requested, your account has been scheduled for deletion. The deletion will be completed in 30 days.</p>
        <p>If this was done in error, you can contact support to cancel the deletion process.</p>
        <p>Please note: After 30 days, all your data will be permanently deleted and cannot be recovered.</p>
        <p>Best regards,<br>AI Assistant Team</p>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Deletion email sent successfully",
        data 
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
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
