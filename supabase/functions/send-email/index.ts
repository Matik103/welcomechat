
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, content } = await req.json();

    const client = new SmtpClient();

    // Connect to Namecheap Private Email SMTP server
    await client.connectTLS({
      hostname: "mail.privateemail.com",
      port: 465, // Using SSL port
      username: Deno.env.get("SMTP_USER")!,
      password: Deno.env.get("SMTP_PASS")!,
    });

    const sender = Deno.env.get("SMTP_USER")!;
    console.log('Preparing to send email from:', sender, 'to:', to);

    // Send the email
    const result = await client.send({
      from: sender,
      to: to,
      subject: subject,
      content: content,
      html: content,
    });

    console.log('Email sent successfully:', result);
    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
