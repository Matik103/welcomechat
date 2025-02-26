
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

    console.log(`Attempting to send invitation email to ${email} for role ${role_type}`);

    // Configure SMTP connection
    const config = {
      hostname: Deno.env.get("SMTP_HOST")!,
      port: Number(Deno.env.get("SMTP_PORT")),
      username: Deno.env.get("SMTP_USER")!,
      password: Deno.env.get("SMTP_PASS")!,
    };

    console.log("Connecting to SMTP server...");
    await client.connectTLS(config);

    const senderEmail = Deno.env.get("SMTP_SENDER")!;
    
    console.log("Sending email...");
    await client.send({
      from: senderEmail,
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
          </body>
        </html>
      `,
      html: true,
    });

    console.log("Email sent successfully");

    // Close the connection
    await client.close();

    // Log the successful email sending
    try {
      const { error: logError } = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/email_logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        },
        body: JSON.stringify({
          email_to: email,
          subject: `Invitation as ${role_type}`,
          status: "sent",
          metadata: { role_type, url }
        }),
      }).then(res => res.json());

      if (logError) {
        console.error("Error logging email:", logError);
      }
    } catch (logError) {
      console.error("Error logging email to database:", logError);
    }

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
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);

    // Make sure to close the SMTP connection in case of error
    try {
      await client.close();
    } catch (closeError) {
      console.error("Error closing SMTP connection:", closeError);
    }

    // Log the error
    try {
      const body = await req.json();
      await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/email_logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        },
        body: JSON.stringify({
          email_to: body.email,
          subject: "Invitation failed",
          status: "error",
          error: error.message
        }),
      });
    } catch (logError) {
      console.error("Error logging email failure:", logError);
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
