
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
    
    console.log('Received request to send email:', {
      to,
      subject,
      contentLength: content?.length
    });

    if (!to || !subject || !content) {
      throw new Error('Missing required email parameters');
    }

    const smtpUsername = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASS");

    if (!smtpUsername || !smtpPassword) {
      throw new Error('SMTP credentials not configured');
    }

    console.log('Initializing SMTP client...');
    const client = new SmtpClient();

    try {
      console.log('Connecting to SMTP server...');
      await client.connectTLS({
        hostname: "mail.privateemail.com",
        port: 465,
        username: smtpUsername,
        password: smtpPassword,
      });

      console.log('Successfully connected to SMTP server');

      const emailPayload = {
        from: smtpUsername,
        to: to,
        subject: subject,
        content: content,
        html: content,
      };

      console.log('Sending email...');
      const result = await client.send(emailPayload);
      console.log('Email sent successfully:', result);

      await client.close();
      console.log('SMTP connection closed');

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (smtpError) {
      console.error('SMTP Error:', smtpError);
      // Make sure to close the client even if there's an error
      try {
        await client.close();
      } catch (closeError) {
        console.error('Error closing SMTP connection:', closeError);
      }
      throw smtpError;
    }

  } catch (error) {
    console.error('Error in email function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
