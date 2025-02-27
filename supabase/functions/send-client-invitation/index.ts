
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  clientId: string;
  email: string;
  clientName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, email, clientName }: InvitationRequest = await req.json();

    // Generate a unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // Token expires in 48 hours

    // Create invitation record
    const { error: invitationError } = await supabase
      .from("client_invitations")
      .insert({
        client_id: clientId,
        email,
        token,
        expires_at: expiresAt.toISOString(),
        status: "pending"
      });

    if (invitationError) {
      throw new Error(`Failed to create invitation: ${invitationError.message}`);
    }

    // Send invitation email
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "http://localhost:3000";
    const setupUrl = `${baseUrl}/client/setup?token=${token}`;

    const { error: emailError } = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: [email],
      subject: `Welcome to ${clientName}'s AI Assistant Dashboard`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Welcome to Your AI Assistant Dashboard</h1>
          <p>You've been invited to manage the AI assistant for ${clientName}.</p>
          <p>To get started, click the button below to set up your account:</p>
          <a href="${setupUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Set Up Your Account</a>
          <p style="color: #666;">This invitation link will expire in 48 hours.</p>
          <p style="color: #666;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError}`);
    }

    return new Response(
      JSON.stringify({ message: "Invitation sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in send-client-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
