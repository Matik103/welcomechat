
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Resend } from 'npm:resend@1.0.0';
import { corsHeaders } from '../_shared/cors.ts';

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

// Function to validate email address
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Received email request");
    
    // Initialize Resend with API key from Supabase environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_4YMVyqm2_Bzysfnt8rzVEjewRp1haXciL';
    
    const resend = new Resend(resendApiKey);

    // Get the request body and validate it
    let requestData: EmailRequest;
    try {
      requestData = await req.json() as EmailRequest;
      console.log("Parsed request body:", JSON.stringify(requestData, null, 2));
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', success: false }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { to, subject, html, from = 'Welcome.Chat <admin@welcome.chat>' } = requestData;

    // Validate required fields
    if (!to || !subject || !html) {
      const missingFields = [];
      if (!to) missingFields.push('to');
      if (!subject) missingFields.push('subject');
      if (!html) missingFields.push('html');
      
      console.error(`Missing required fields: ${missingFields.join(', ')}`);
      
      return new Response(
        JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}`, success: false }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    // Validate email format
    const emails = Array.isArray(to) ? to : [to];
    const invalidEmails = emails.filter(email => !isValidEmail(email));
    
    if (invalidEmails.length > 0) {
      console.error(`Invalid email format: ${invalidEmails.join(', ')}`);
      return new Response(
        JSON.stringify({ error: `Invalid email format: ${invalidEmails.join(', ')}`, success: false }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Attempting to send email to ${Array.isArray(to) ? to.join(', ') : to}`);
    
    // Send the email
    try {
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
          JSON.stringify({ error: `Failed to send email: ${error.message}`, success: false }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      console.log('Email sent successfully:', data);
      
      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (emailError) {
      console.error('Resend API error:', emailError);
      return new Response(
        JSON.stringify({ 
          error: emailError instanceof Error ? emailError.message : 'Unknown email service error',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred', success: false }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
