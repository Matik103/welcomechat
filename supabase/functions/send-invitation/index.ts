
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  role_type: 'admin' | 'client';
  url: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const client = new SmtpClient();

  try {
    const { email, role_type, url }: InvitationEmailRequest = await req.json();
    console.log(`Starting invitation email to ${email}`);

    await client.connectTLS({
      hostname: "mail.privateemail.com",
      port: 465,
      username: Deno.env.get("SMTP_USER"),
      password: Deno.env.get("SMTP_PASS"),
    });

    await client.send({
      from: Deno.env.get("SMTP_SENDER")!,
      to: email,
      subject: `You've been invited as ${role_type}`,
      content: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h1>You've Been Invited!</h1>
            <p>You have been invited to join as a ${role_type}.</p>
            <p>Click the link below to accept your invitation:</p>
            <a href="${url}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Accept Invitation</a>
            <p>If you did not expect this invitation, please ignore this email.</p>
            <p>This invitation will expire in 48 hours.</p>
          </body>
        </html>
      `,
      html: true,
    });

    await client.close();
    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error("Failed to send invitation:", error);

    try {
      await client.close();
    } catch (closeError) {
      console.error("Error closing SMTP connection:", closeError);
    }

    return new Response(
      JSON.stringify({
        error: "Failed to send invitation email",
        details: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
};

serve(handler);
