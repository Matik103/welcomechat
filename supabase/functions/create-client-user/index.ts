
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendEmail(to: string, subject: string, htmlContent: string) {
  const client = new SmtpClient();

  const config = {
    hostname: Deno.env.get('SMTP_HOST')!,
    port: Number(Deno.env.get('SMTP_PORT')),
    username: Deno.env.get('SMTP_USER')!,
    password: Deno.env.get('SMTP_PASS')!,
  };

  await client.connectTLS(config);

  await client.send({
    from: Deno.env.get('SMTP_SENDER')!,
    to: to,
    subject: subject,
    content: htmlContent,
    html: htmlContent,
  });

  await client.close();
}

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

    // Send welcome email with setup instructions using SMTP
    try {
      await sendEmail(
        email,
        'Welcome to Interact Metrics - Setup Instructions',
        `
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
      );
      console.log('Successfully sent welcome email');
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

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
