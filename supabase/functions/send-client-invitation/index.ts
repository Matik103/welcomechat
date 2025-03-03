
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  clientId: string;
  email: string;
  clientName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { clientId, email, clientName } = await req.json() as InvitationRequest;

    if (!clientId || !email) {
      return new Response(
        JSON.stringify({ error: "Client ID and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a secure random token
    const token = crypto.randomUUID();
    
    // Set expiration for 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Check if an invitation already exists
    const { data: existingInvitation } = await supabaseClient
      .from("client_invitations")
      .select("id, status")
      .eq("email", email)
      .eq("client_id", clientId)
      .single();

    let invitationId;

    if (existingInvitation) {
      // Update existing invitation with new token and expiration
      const { data, error } = await supabaseClient
        .from("client_invitations")
        .update({
          token,
          expires_at: expiresAt.toISOString(),
          status: "pending", // Reset to pending if it was previously used
        })
        .eq("id", existingInvitation.id)
        .select()
        .single();

      if (error) throw error;
      invitationId = data.id;
    } else {
      // Create a new invitation
      const { data, error } = await supabaseClient
        .from("client_invitations")
        .insert({
          client_id: clientId,
          email,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      invitationId = data.id;
    }

    // Get the public site URL from environment or use a default value
    const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://chat.welcome.com";
    const setupUrl = `${siteUrl}/client/setup?token=${token}`;
    
    // Send the invitation email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "AI Assistant <admin@welcome.chat>",
      to: [email],
      subject: `Setup Your AI Assistant Dashboard for ${clientName}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
              <h1 style="color: #4F46E5;">AI Assistant Dashboard Setup</h1>
              <p>Hello,</p>
              <p>You have been invited to set up your AI Assistant Dashboard for <strong>${clientName}</strong>.</p>
              <p>Please click the button below to create your password and access your dashboard:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${setupUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Set Up Your Account</a>
              </div>
              <p>This link will expire in 7 days. If you have any questions, please contact support.</p>
              <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
                Best regards,<br>
                AI Assistant Team
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    // Log the email sending
    await supabaseClient.from("email_logs").insert({
      email_to: email,
      subject: `Setup Your AI Assistant Dashboard for ${clientName}`,
      status: "sent",
      metadata: { 
        clientId, 
        clientName,
        invitationId
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully",
        data: emailData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
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
