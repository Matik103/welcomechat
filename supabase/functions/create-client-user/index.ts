
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, clientName, aiAgentName } = await req.json()

    // Create the user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true,
      password: crypto.randomUUID(), // Generate a random password
      user_metadata: {
        client_name: clientName
      }
    })

    if (userError) throw userError

    // Generate password reset link
    const { data: linkData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        data: {
          client_name: clientName,
          agent_name: aiAgentName
        }
      }
    })

    if (resetError) throw resetError

    // Send welcome email with setup instructions using Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Interact Metrics <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to Interact Metrics - Setup Instructions',
      html: `
        <h1>Welcome to Interact Metrics!</h1>
        <p>Hello ${clientName},</p>
        <p>Your account has been created successfully. To get started:</p>
        <ol>
          <li>Click the link below to set up your password:</li>
          <li><a href="${linkData?.properties?.action_link}">Set Up Your Password</a></li>
          <li>After setting your password, you'll be able to access your dashboard</li>
          <li>Your AI agent "${aiAgentName}" has been created and is ready for configuration</li>
        </ol>
        <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
        <p>Best regards,<br>The Interact Metrics Team</p>
      `
    });

    if (emailError) throw emailError

    console.log('Successfully created user and sent welcome email');

    return new Response(
      JSON.stringify({ message: 'User created successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in create-client-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
