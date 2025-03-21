
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@1.0.0'

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // This allows requests from any origin 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
}

serve(async (req) => {
  console.log("📩 Email function called:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("🔄 Handling OPTIONS request for CORS preflight");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  // Get Resend API key from environment variables
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    console.error('❌ Missing RESEND_API_KEY environment variable');
    return new Response(
      JSON.stringify({ error: 'Missing RESEND_API_KEY environment variable' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }

  try {
    // Initialize Resend client
    const resend = new Resend(RESEND_API_KEY);
    console.log("✅ Resend client initialized");

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("✅ Request body parsed successfully:", {
        to: requestBody.to,
        subject: requestBody.subject,
        fromProvided: !!requestBody.from,
        htmlLength: requestBody.html ? requestBody.html.length : 0
      });
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    const { to, subject, html, from = 'Welcome.Chat <admin@welcome.chat>' } = requestBody;

    // Validate request data
    if (!to) {
      console.error('❌ Missing required field: to');
      return new Response(
        JSON.stringify({ error: 'Missing required field: to' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }
    
    if (!subject) {
      console.error('❌ Missing required field: subject');
      return new Response(
        JSON.stringify({ error: 'Missing required field: subject' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }
    
    if (!html) {
      console.error('❌ Missing required field: html');
      return new Response(
        JSON.stringify({ error: 'Missing required field: html' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    console.log(`📧 Sending email to ${to} with subject "${subject}"`);

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    console.log('✅ Email sent successfully:', data);
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error) {
    console.error('❌ Error in send-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})
