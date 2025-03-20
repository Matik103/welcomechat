
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Use the API key directly
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
    const { clientId, clientName, email, agentName } = await req.json();

    // Create recovery token
    const { data, error } = await supabase
      .from("client_recovery_tokens")
      .insert({
        client_id: clientId,
        token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single();

    if (error) throw new Error(`Error creating recovery token: ${error.message}`);

    const recoveryLink = `${Deno.env.get("PUBLIC_SITE_URL")}/recover-client?token=${data.token}`;
    const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const formattedDeletionDate = deletionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const agentInfo = agentName ? ` with AI assistant "${agentName}"` : '';

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Welcome.Chat <admin@welcome.chat>",
      to: email,
      subject: "Important: Your Account Is Scheduled for Deletion",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Account Deletion Notice</h1>
          
          <p>Hello,</p>
          
          <p>We're reaching out to inform you that your client account "${clientName}"${agentInfo} has been scheduled for deletion.</p>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Scheduled deletion date:</strong> ${formattedDeletionDate}</p>
          </div>
          
          <p>If this was done in error, or if you wish to restore your account, you can recover it by clicking the button below within the next 30 days:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${recoveryLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Recover My Account</a>
          </div>
          
          <p>If you don't take any action, your account and all associated data will be permanently deleted after the scheduled date.</p>
          
          <p>If you have any questions or concerns, please contact our support team.</p>
          
          <p>Best regards,<br>Welcome.Chat Team</p>
          
          <div style="font-size: 12px; color: #777; margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee;">
            <p>If you did request this deletion, no action is required. Your account will be automatically deleted on the scheduled date.</p>
          </div>
        </div>
      `,
    });

    if (emailError) throw emailError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-deletion-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
