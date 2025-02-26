
// @deno-types="https://raw.githubusercontent.com/jonnywinter/smtp-deno/main/mod.ts"
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Email function loaded');

serve(async (req) => {
  console.log('Received request:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, content } = await req.json();
    console.log('Parsed request data:', { to, subject, contentLength: content?.length });

    const smtp = new SMTPClient({
      connection: {
        hostname: "mail.privateemail.com",
        port: 465,  // Changed back to 465 to match Namecheap's settings
        tls: true,
        auth: {
          username: Deno.env.get("SMTP_USER")!,
          password: Deno.env.get("SMTP_PASS")!,
        }
      }
    });

    console.log('Attempting to send email...');
    
    const sendConfig = {
      from: Deno.env.get("SMTP_USER")!,
      to: to,
      subject: subject,
      content: content,
      html: content,
    };

    console.log('Send configuration prepared');
    
    await smtp.send(sendConfig);
    console.log('Email sent successfully');
    
    await smtp.close();
    console.log('SMTP connection closed');

    return new Response(
      JSON.stringify({ success: true }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in email function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email',
        stack: error.stack
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
