
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Use the updated API key directly
const resend = new Resend("re_36V5aruC_9aScEQmCQqnYzGtuuhg1WFN2");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, email, agentName } = await req.json();
    
    const agentInfo = agentName ? ` with AI assistant "${agentName}"` : '';

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Welcome.Chat <admin@welcome.chat>",
      to: email,
      subject: "Your Client Account Has Been Recovered",
      html: `
        <h1>Client Account Recovered Successfully</h1>
        <p>Hello,</p>
        <p>Your client account "${clientName}"${agentInfo} has been successfully recovered and is now active again.</p>
        <p>You can access your account through the Client Management page.</p>
        <p>Best regards,<br>Welcome.Chat Team</p>
      `,
    });

    if (emailError) throw emailError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-recovery-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
