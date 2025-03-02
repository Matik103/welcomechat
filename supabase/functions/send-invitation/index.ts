
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  inviteUrl: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting send-invitation function");
    const { email, inviteUrl, name }: InvitationRequest = await req.json();

    if (!email || !inviteUrl) {
      throw new Error("Missing required fields: email or inviteUrl");
    }

    console.log(`Sending invitation to: ${email}, inviteUrl: ${inviteUrl}`);
    
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h1>Invitation to AI Assistant</h1>
          <p>Hello${name ? ` ${name}` : ''},</p>
          <p>You've been invited to join the AI Assistant platform as an admin.</p>
          <p>Click the button below to set up your account:</p>
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="font-size: 14px; color: #666;">
            <a href="${inviteUrl}">${inviteUrl}</a>
          </p>
          <p>Best regards,<br>The AI Assistant Team</p>
        </body>
      </html>
    `;
    
    const emailResponse = await resend.emails.send({
      from: "AI Assistant <admin@welcome.chat>", // Using the specified from email
      to: [email],
      subject: "Invitation to AI Assistant Platform",
      html: emailHtml,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
