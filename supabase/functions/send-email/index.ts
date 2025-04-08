
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
      throw new Error('RESEND_API_KEY environment variable is not set in Supabase secrets');
    }
    
    const resend = new Resend(resendApiKey);

    // Get the request body
    const { to, subject, html, from = 'Welcome.Chat <admin@welcome.chat>' } = await req.json() as EmailRequest;

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, and html are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Attempting to send email to ${Array.isArray(to) ? to.join(', ') : to}`);
    
    // Send the email
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    // Log success/error information
    if (error) {
      console.error('Email sending failed:', error);
      return new Response(
        JSON.stringify({ error: `Failed to send email: ${error.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log('Email sent successfully:', data);
    
    // Log the email sending in database
    // This is optional but helpful for tracking
    try {
      const { error: logError } = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/email_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
        },
        body: JSON.stringify({
          email_to: Array.isArray(to) ? to.join(', ') : to,
          subject,
          status: 'sent',
          sent_at: new Date().toISOString(),
        }),
      }).then(res => res.json());
      
      if (logError) {
        console.warn('Failed to log email sending:', logError);
      }
    } catch (logErr) {
      console.warn('Error logging email sending:', logErr);
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
