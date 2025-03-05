
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendEmail(to: string, subject: string, htmlContent: string) {
  console.log('Starting email send process...');
  const client = new SmtpClient();
  
  try {
    // Log configuration (excluding password)
    console.log('SMTP Configuration:', {
      hostname: Deno.env.get('SMTP_HOST'),
      port: Number(Deno.env.get('SMTP_PORT')),
      username: Deno.env.get('SMTP_USER'),
    });

    // Connect using TLS
    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOST')!,
      port: Number(Deno.env.get('SMTP_PORT')),
      username: Deno.env.get('SMTP_USER')!,
      password: Deno.env.get('SMTP_PASS')!,
    });

    const sender = Deno.env.get('SMTP_SENDER')!;
    console.log('Preparing to send email from:', sender, 'to:', to);

    await client.send({
      from: sender,
      to: to,
      subject: subject,
      content: htmlContent,
    });

    console.log('Email sent successfully');
    await client.close();
  } catch (error) {
    console.error('Error in sendEmail:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    await client.close().catch(console.error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting create-client-user function');
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
    console.log('Received request for:', email);

    // Check if user already exists
    console.log('Checking if user already exists...');
    const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (getUserError && getUserError.message !== 'User not found') {
      console.error('Error checking for existing user:', getUserError);
      throw getUserError;
    }

    let userId;
    
    if (existingUser) {
      console.log('User already exists, skipping creation step');
      userId = existingUser.id;
      
      // Update metadata if needed
      if (!existingUser.user_metadata?.client_name) {
        console.log('Updating user metadata...');
        await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              client_name: clientName
            }
          }
        );
      }
    } else {
      // Get the stored temporary password for this user
      const { data: passwordData, error: passwordError } = await supabaseAdmin
        .from('client_temp_passwords')
        .select('temp_password')
        .eq('email', email)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      let userPassword;
        
      if (passwordError || !passwordData) {
        console.log('No stored password found, generating a random one');
        userPassword = crypto.randomUUID(); // Fallback to random UUID if no password found
      } else {
        console.log('Using stored temporary password');
        userPassword = passwordData.temp_password;
        
        // Mark password as used
        await supabaseAdmin
          .from('client_temp_passwords')
          .update({ used: true })
          .eq('email', email)
          .eq('temp_password', userPassword);
      }
      
      // Create the user with the temporary password
      console.log('Creating new user account...');
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        password: userPassword,
        user_metadata: {
          client_name: clientName
        }
      });

      if (userError) {
        console.error('Error creating user:', userError);
        throw userError;
      }
      console.log('User account created successfully');
      userId = userData.user.id;
    }

    // Generate password reset link (works for both new and existing users)
    console.log('Generating password reset link...');
    const { data: linkData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        data: {
          client_name: clientName,
          agent_name: aiAgentName
        }
      }
    });

    if (resetError) {
      console.error('Error generating reset link:', resetError);
      throw resetError;
    }
    console.log('Reset link generated successfully');

    // Send welcome email with setup instructions
    try {
      console.log('Sending welcome email...');
      const resetLink = linkData?.properties?.action_link;
      console.log('Reset link:', resetLink);

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';

      // Try the new Resend API first
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            to: email,
            subject: 'Welcome to Interact Metrics - Setup Instructions',
            html: `
              <h1>Welcome to Interact Metrics!</h1>
              <p>Hello ${clientName},</p>
              <p>Your account has been created successfully. To get started:</p>
              <ol>
                <li>Click the link below to set up your password:</li>
                <li><a href="${resetLink}">Set Up Your Password</a></li>
                <li>After setting your password, you'll be able to access your dashboard</li>
                <li>Your AI agent "${aiAgentName}" has been created and is ready for configuration</li>
              </ol>
              <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
              <p>Best regards,<br>The Interact Metrics Team</p>
            `
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response from send-email function:', errorData);
          throw new Error(`Resend email failed: ${errorData.error || response.statusText}`);
        }
        
        console.log('Welcome email sent successfully using Resend');
      } catch (resendError) {
        console.error('Resend email failed, falling back to SMTP:', resendError);
        
        // Fallback to SMTP
        await sendEmail(
          email,
          'Welcome to Interact Metrics - Setup Instructions',
          `
          <h1>Welcome to Interact Metrics!</h1>
          <p>Hello ${clientName},</p>
          <p>Your account has been created successfully. To get started:</p>
          <ol>
            <li>Click the link below to set up your password:</li>
            <li><a href="${resetLink}">Set Up Your Password</a></li>
            <li>After setting your password, you'll be able to access your dashboard</li>
            <li>Your AI agent "${aiAgentName}" has been created and is ready for configuration</li>
          </ol>
          <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
          <p>Best regards,<br>The Interact Metrics Team</p>
          `
        );
        console.log('Welcome email sent successfully using SMTP fallback');
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      throw emailError;
    }

    return new Response(
      JSON.stringify({ 
        message: 'User created or updated successfully',
        isNewUser: !existingUser
      }),
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
