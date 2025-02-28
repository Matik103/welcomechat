
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

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

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Function invoked with method:", req.method);
    
    const body: DeletionEmailRequest = await req.json();
    console.log("Received request body:", body);

    const { clientId, clientName, email } = body;

    if (!clientId || !clientName || !email) {
      console.error("Missing required parameters:", { clientId, clientName, email });
      throw new Error("Missing required parameters");
    }

    // Use Resend for email
    try {
      const { error: emailError } = await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          subject: "Account Deletion Notice",
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h1>Account Deletion Notice</h1>
                <p>Dear ${clientName},</p>
                <p>As requested, your account has been scheduled for deletion. The deletion will be completed in 30 days.</p>
                <p>If this was done in error, you can contact support to cancel the deletion process.</p>
                <p>Please note: After 30 days, all your data will be permanently deleted and cannot be recovered.</p>
                <p>Best regards,<br>AI Assistant Team</p>
              </body>
            </html>
          `
        },
      });

      if (emailError) {
        throw new Error(`Error sending email: ${emailError.message}`);
      }

      console.log("Email sent successfully");
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
