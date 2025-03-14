import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to generate a random password if we can't find one
async function generateTemporaryPassword(supabaseAdmin: any, email: string) {
  try {
    console.log('Generating new random password');
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const userPassword = `Welcome${randomDigits}!`;
    
    // Store this password for future reference
    console.log('Storing new generated password');
    await supabaseAdmin
      .from('client_temp_passwords')
      .insert({
        email: email,
        temp_password: userPassword,
        created_at: new Date().toISOString(),
        used: false
      });
      
    console.log('Password stored successfully');
    return userPassword;
  } catch (error) {
    console.error('Error generating temporary password:', error);
    // Fallback to a simple password if storing fails
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `Welcome${randomDigits}!`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting create-client-user function');
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization') || req.headers.get('apikey');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceRole: !!serviceRoleKey,
        hasResend: !!resendApiKey
      });
      throw new Error('Missing required environment variables');
    }

    if (!resendApiKey.startsWith('re_')) {
      console.error('Invalid Resend API key format');
      throw new Error('Invalid Resend API key format - should start with re_');
    }

    console.log('Creating Supabase client with:', {
      url: supabaseUrl,
      hasServiceRole: !!serviceRoleKey
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    // Test the client immediately
    const { data: testData, error: testError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .limit(1);

    console.log('Initial test query result:', {
      success: !testError,
      error: testError?.message,
      data: testData
    });

    // Log environment variables (without sensitive values)
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRole: !!serviceRoleKey,
      hasResendApiKey: !!resendApiKey,
      url: supabaseUrl
    });

    const { email, clientName, aiAgentName } = await req.json()
    if (!email || !clientName) {
      console.error('Missing required fields:', { email, clientName });
      return new Response(
        JSON.stringify({ error: 'Email and client name are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }
    
    console.log('Received request for:', { email, clientName, aiAgentName });

    try {
      // Check if user already exists
      console.log('Checking if user already exists...');
      const { data: { users: existingUsers }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.find(user => user.email === email);
      
      if (getUserError) {
        console.error('Error checking for existing user:', getUserError);
        throw getUserError;
      }

      let userId;
      let userPassword;
      
      if (existingUser) {
        console.log('User already exists, skipping creation step');
        userId = existingUser.id;
        
        // Generate a new temporary password for existing users too
        console.log('Generating new temporary password for existing user');
        userPassword = await generateTemporaryPassword(supabaseAdmin, email);
        
        // Update user with new password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            password: userPassword,
            user_metadata: {
              client_name: clientName
            }
          }
        );

        if (updateError) {
          console.error('Error updating user:', updateError);
          throw updateError;
        }
      } else {
        // Get the stored temporary password for this user
        console.log('Retrieving temporary password for:', email);
        const { data: passwordData, error: passwordError } = await supabaseAdmin
          .from('client_temp_passwords')
          .select('temp_password')
          .eq('email', email)
          .eq('used', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (passwordError || !passwordData) {
          console.log('No stored password found, generating a new one');
          userPassword = await generateTemporaryPassword(supabaseAdmin, email);
        } else {
          console.log('Found stored password, using it for account creation');
          userPassword = passwordData.temp_password;
        }
        
        // Create the user with the temporary password
        console.log('Creating new user account with email and password');
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
        
        // First create the client record
        console.log('Creating client record...');
        const { data: clientData, error: clientError } = await supabaseAdmin
          .from('clients')
          .insert({
            id: userId,
            client_name: clientName,
            email: email,
            agent_name: aiAgentName,
            status: 'active'
          })
          .select()
          .single();

        if (clientError) {
          console.error('Error creating client record:', clientError);
          throw clientError;
        }
        console.log('Client record created successfully:', clientData);
        
        // Now create AI agent for the client
        console.log('Creating AI agent...');
        const { data: agentData, error: agentError } = await supabaseAdmin
          .from('ai_agents')
          .insert({
            agent_name: aiAgentName,
            client_id: userId,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (agentError) {
          console.error('Error creating AI agent:', agentError);
          throw agentError;
        }
        console.log('AI agent created successfully:', agentData);

        // Mark password as used
        if (passwordData) {
          console.log('Marking password as used');
          await supabaseAdmin
            .from('client_temp_passwords')
            .update({ used: true })
            .eq('email', email)
            .eq('temp_password', passwordData.temp_password);
        }
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

        // Get the current password for inclusion in the email
        const { data: currentPassword } = await supabaseAdmin
          .from('client_temp_passwords')
          .select('temp_password')
          .eq('email', email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        const passwordToUse = currentPassword?.temp_password || userPassword || 'Your temporary password';
        console.log('Password to include in email:', passwordToUse);

        // Initialize Resend
        console.log('Initializing Resend with API key:', resendApiKey ? `${resendApiKey.substring(0, 5)}...` : 'Missing');
        const resend = new Resend(resendApiKey);
        
        // Send email using Resend
        try {
          console.log('Attempting to send email with:', {
            to: email,
            from: 'Welcome.Chat <admin@welcome.chat>',
            replyTo: 'admin@welcome.chat',
            subject: 'Welcome to Welcome.Chat - Get Started',
            hasResetLink: !!resetLink,
            hasPassword: !!passwordToUse
          });
          
          const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Welcome.Chat <admin@welcome.chat>',
            reply_to: 'admin@welcome.chat',
            to: email,
            subject: 'Welcome to Welcome.Chat - Get Started',
            html: [
              '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">',
              '<h1 style="color: #333;">Welcome to Welcome.Chat! 👋</h1>',
              `<p>Hello ${clientName},</p>`,
              '<p>Your account has been created successfully. Here are your login credentials:</p>',
              `<p><strong>Email:</strong> ${email}<br>`,
              `<strong>Temporary Password:</strong> ${passwordToUse}</p>`,
              '<div style="margin: 30px 0;">',
              '  <p style="font-weight: bold;">Next Steps:</p>',
              '  <ol style="line-height: 1.6;">',
              `    <li><a href="${resetLink}" style="color: #0066cc; text-decoration: none; font-weight: bold;">Click here to set up your secure password</a></li>`,
              '    <li>Once your password is set, you can access your dashboard</li>',
              `    <li>Configure your AI agent "${aiAgentName}" in the settings</li>`,
              '  </ol>',
              '</div>',
              '<p style="color: #666; font-size: 14px;">For security reasons, please change your password immediately upon logging in.</p>',
              '<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">',
              '<p style="color: #666;">Need assistance? Our support team is here to help!<br>',
              'Simply reply to this email or contact us at support@welcome.chat</p>',
              '<p style="color: #666;">Best regards,<br>The Welcome.Chat Team</p>',
              '</div>'
            ].join('\n')
          });

          if (emailError) {
            console.error('Resend API Error:', {
              error: emailError,
              errorCode: emailError.statusCode,
              errorMessage: emailError.message
            });
            throw emailError;
          }
          
          console.log('Welcome email sent successfully:', {
            emailId: emailData?.id,
            to: email
          });
        } catch (sendError) {
          console.error('Detailed email sending error:', {
            error: sendError,
            stack: sendError.stack,
            context: {
              to: email,
              resetLinkProvided: !!resetLink,
              passwordProvided: !!passwordToUse
            }
          });
          throw new Error(`Failed to send welcome email: ${sendError.message}`);
        }
      } catch (emailError) {
        console.error('Email process error:', emailError);
        throw new Error(`Failed to send welcome email: ${emailError.message}`);
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
        JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Always return 200 to avoid CORS issues
        }
      )
    }

  } catch (error) {
    console.error('Error in create-client-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Always return 200 to avoid CORS issues
      }
    )
  }
})
