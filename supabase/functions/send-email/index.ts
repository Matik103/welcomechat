
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Resend } from 'npm:resend@1.0.0';
import { corsHeaders } from '../_shared/cors.ts';

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Resend with API key from Supabase environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    
    const resend = new Resend(resendApiKey);

    // Get the request body
    const { to, subject, html, from = 'WelcomeChat <admin@welcome.chat>' } = await req.json() as EmailRequest;

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: to, subject, and html are required'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log("Sending email:", {
      to,
      subject,
      from,
      htmlLength: html.length
    });

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html
    });

    if (error) {
      console.error('Email sending error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log("Email sent successfully:", data);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
