
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
      hostname: "smtp.gmail.com",
      port: 465,
      username: Deno.env.get("GMAIL_USER"), // your Gmail address
      password: Deno.env.get("GMAIL_APP_PASSWORD"), // your Gmail app password
    });

    await client.send({
      from: Deno.env.get("GMAIL_USER")!,
      to: email,
      subject: `You've been invited as ${role_type}`,
      html: `
        <h1>You've Been Invited!</h1>
        <p>You have been invited to join as a ${role_type}.</p>
        <p>Click the link below to accept your invitation:</p>
        <a href="${url}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Accept Invitation</a>
        <p>If you did not expect this invitation, please ignore this email.</p>
      `,
    });

    await client.close();

    console.log("Email sent successfully to:", email);

    return new Response(
      JSON.stringify({ message: "Invitation sent successfully" }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
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
