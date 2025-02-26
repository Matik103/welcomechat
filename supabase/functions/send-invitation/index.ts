
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

const client = new SmtpClient();

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role_type, url }: InvitationEmailRequest = await req.json();

    console.log(`Sending invitation email to ${email} for role ${role_type}`);

    await client.connectTLS({
      hostname: Deno.env.get("SMTP_HOST")!,
      port: Number(Deno.env.get("SMTP_PORT")),
      username: Deno.env.get("SMTP_USER")!,
      password: Deno.env.get("SMTP_PASS")!,
    });

    const senderEmail = Deno.env.get("SMTP_SENDER")!;
    
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

    await client.close();

    // Log the email sending
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

    if (logError) console.error("Error logging email:", logError);

    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);

    // Log the error
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/email_logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        },
        body: JSON.stringify({
          email_to: (await req.json()).email,
          subject: "Invitation failed",
          status: "error",
          error: error.message
        }),
      });
    } catch (logError) {
      console.error("Error logging email failure:", logError);
    }

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
