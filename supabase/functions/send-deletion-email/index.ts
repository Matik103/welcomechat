
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, clientName, email, agentName } = await req.json();
    console.log("Processing deletion email for:", { clientId, clientName, email });

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

    if (error) {
      console.error("Error creating recovery token:", error);
      throw new Error(`Error creating recovery token: ${error.message}`);
    }

    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://welcomeai.io";
    const recoveryLink = `${publicSiteUrl}/recover-client?token=${data.token}`;
    const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const formattedDeletionDate = deletionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const agentInfo = agentName ? ` with AI assistant "${agentName}"` : '';

    console.log("Sending email with recovery link:", recoveryLink);

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

    if (emailError) {
      console.error("Email sending error:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", emailData);

    // Log client activity for email sent
    await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: "email_sent",
        description: `Deletion notification email sent to ${clientName}`,
        metadata: { 
          email_type: "deletion_notification",
          recipient_email: email,
          recovery_token: data.token,
          deletion_date: formattedDeletionDate
        }
      });

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-deletion-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
