import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, fullName } = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    // Send welcome email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'admin@welcome.chat',
        to: email,
        subject: 'Welcome to Welcome.Chat Admin Portal',
        html: `
          <h2>Welcome to Welcome.Chat!</h2>
          <p>Hello ${fullName || 'Admin'},</p>
          <p>Your admin account has been created successfully. You can now log in to the Welcome.Chat admin portal.</p>
          <p>Please verify your email address by clicking the verification link sent in a separate email.</p>
          <p>Best regards,<br>The Welcome.Chat Team</p>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send welcome email')
    }

    return new Response(
      JSON.stringify({ message: 'Welcome email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 