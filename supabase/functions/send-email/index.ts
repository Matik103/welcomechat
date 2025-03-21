
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // This allows requests from any origin 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
}

// Define Resend API types
interface ResendEmailResponse {
  id?: string;
  error?: {
    message: string;
    statusCode: number;
  };
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
    console.log("✅ Starting email sending process with Resend");

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

    // Send email using Resend API directly with fetch
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    const responseData = await resendResponse.json() as ResendEmailResponse;
    
    if (!resendResponse.ok) {
      const errorMessage = responseData.error?.message || 'Unknown error from Resend API';
      console.error('❌ Resend API error:', errorMessage);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: resendResponse.status,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    console.log('✅ Email sent successfully:', responseData);
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true, data: responseData }),
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
