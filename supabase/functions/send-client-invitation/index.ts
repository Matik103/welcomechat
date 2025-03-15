import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface InvitationRequest {
  clientId: string;
  email: string;
  clientName: string;
  agentName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    console.log("Send client invitation function started");
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body received:", JSON.stringify(requestBody));
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { clientId, email, clientName, agentName } = requestBody as InvitationRequest;
    
    if (!clientId || !email || !clientName || !agentName) {
      console.error("Missing required parameters:", { clientId, email, clientName, agentName });
      return new Response(
        JSON.stringify({ error: "Missing required parameters", details: { clientId, email, clientName, agentName } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Processing invitation for client: ${clientName} (${email}), ID: ${clientId}`);
    
    // Get the origin from request headers or use default
    const origin = req.headers.get("origin") || "https://welcome.chat";
    console.log("Using origin:", origin);
    
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error", details: "Missing Supabase credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Initializing Supabase admin client");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create AI agent record
    try {
      console.log("Creating AI agent record...");
      const { data: agentData, error: agentError } = await supabaseAdmin
        .from('ai_agents')
        .insert({
          id: crypto.randomUUID(),
          client_id: clientId,
          name: agentName,
          settings: {
            personality: "professional",
            tone: "friendly",
            language: "english"
          }
        })
        .select()
        .single();

      if (agentError) {
        console.error("Error creating AI agent:", agentError);
        return new Response(
          JSON.stringify({ error: "Failed to create AI agent", details: agentError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("AI agent created successfully:", agentData);
    } catch (agentError) {
      console.error("Exception creating AI agent:", agentError);
      return new Response(
        JSON.stringify({ error: "AI agent creation failed", details: agentError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate and store temporary password
    // Create a predictable password using the email
    const tempPassword = `Welcome${email.split('@')[0]}!`;
    
    try {
      console.log("Starting user creation/update process...");
      console.log("Generated temporary password:", tempPassword);
      
      // First, try to get the user
      console.log("Checking for existing user with email:", email);
      const { data: { users: existingUsers }, error: getUserError } = await supabaseAdmin
        .auth
        .admin
        .listUsers();
      
      if (getUserError) {
        console.error("Error checking for existing user:", getUserError);
        return new Response(
          JSON.stringify({ error: "Failed to check for existing user", details: getUserError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const existingUser = existingUsers.find(user => user.email === email);
      let authUser;
      
      if (existingUser) {
        console.log("Existing user found:", {
          id: existingUser.id,
          email: existingUser.email,
          created_at: existingUser.created_at
        });
        
        // Update existing user's password and role
        console.log("Attempting to update user password and role...");
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .auth
          .admin
          .updateUserById(existingUser.id, {
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              role: 'client',
              client_id: clientId,
              client_name: clientName,
              is_client: true,
              default_path: '/client/dashboard',
              access_level: 'client_only'
            },
            app_metadata: {
              role: 'client',
              client_id: clientId,
              is_client: true,
              default_path: '/client/dashboard',
              access_level: 'client_only'
            }
          });
        
        if (updateError) {
          console.error("Error updating user:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update user", details: updateError }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        authUser = updatedUser;
        console.log("User updated successfully");
      } else {
        console.log("No existing user found, creating new user...");
        // Create new user with client role
        const { data: newUser, error: createError } = await supabaseAdmin
          .auth
          .admin
          .createUser({
            email: email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              role: 'client',
              client_id: clientId,
              client_name: clientName,
              is_client: true,
              default_path: '/client/dashboard',
              access_level: 'client_only'
            },
            app_metadata: {
              role: 'client',
              client_id: clientId,
              is_client: true,
              default_path: '/client/dashboard',
              access_level: 'client_only'
            }
          });
        
        if (createError) {
          console.error("Error creating user:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create user", details: createError }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        authUser = newUser;
        console.log("User created successfully");
      }
      
      // Create or update user_roles entry
      if (authUser) {
        console.log("Creating user_roles entry...");
        const { error: userRoleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: authUser.id,
            client_id: clientId,
            role: 'client'
          }, {
            onConflict: 'user_id'
          });

        if (userRoleError) {
          console.error("Error creating user_roles entry:", userRoleError);
          // Don't return error, continue with invitation process
        } else {
          console.log("User roles entry created successfully");
        }
      }
      
      // Store the temporary password for reference
      console.log("Storing temporary password reference...");
      const { error: passwordError } = await supabaseAdmin
        .from('client_temp_passwords')
        .insert({
          id: crypto.randomUUID(),
          client_id: clientId,
          email: email,
          temp_password: tempPassword,
          used: false
        });
        
      if (passwordError) {
        console.error("Error storing temporary password reference:", passwordError);
        // Don't return error here as the auth user is already created/updated
      } else {
        console.log("Temporary password reference stored successfully");
      }
      
      // Log the final credentials for debugging
      console.log("Final login credentials:", {
        email: email,
        password: tempPassword,
        loginUrl: "https://welcome.chat/auth?returnTo=/client/dashboard&userType=client"
      });
    } catch (userError) {
      console.error("Exception in user creation/update process:", {
        error: userError,
        message: userError.message,
        stack: userError.stack
      });
      return new Response(
        JSON.stringify({ 
          error: "User operation failed", 
          details: {
            message: userError.message,
            name: userError.name,
            stack: userError.stack
          }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create invitation record
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    try {
      console.log("Creating invitation record...");
    const { error: inviteError } = await supabaseAdmin
      .from('client_invitations')
      .insert({
          id: crypto.randomUUID(),
        client_id: clientId,
        token: token,
        email: email,
          expires_at: expiresAt.toISOString()
      });

    if (inviteError) {
        console.error("Error creating invitation:", inviteError);
        return new Response(
          JSON.stringify({ error: "Failed to create invitation", details: inviteError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Invitation record created successfully");
    } catch (inviteError) {
      console.error("Exception creating invitation:", inviteError);
      return new Response(
        JSON.stringify({ error: "Invitation creation failed", details: inviteError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email with Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("Missing Resend API key");
      return new Response(
        JSON.stringify({ error: "Server configuration error", details: "Missing Resend API key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    try {
      console.log("Sending invitation email...");
    const resend = new Resend(resendApiKey);
      const setupUrl = `https://welcome.chat/auth?returnTo=/client/dashboard&userType=client&token=${token}`;
    
    const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Welcome.Chat <admin@welcome.chat>",
      to: email,
      subject: "Welcome to Welcome.Chat - Your Account Invitation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to ${agentName}!</h2>
          
          <p>Hello${clientName ? ` ${clientName}` : ''},</p>
          
            <p>You have been invited to create your account for ${agentName}. Your AI assistant has been set up and is ready for you to configure.</p>
          
          <p><strong>Your temporary password is: ${tempPassword}</strong></p>
          
          <p>To complete your account setup:</p>
          
          <ol style="line-height: 1.6;">
              <li>Click the button below to sign in</li>
              <li>Use your email (${email}) and temporary password to log in</li>
              <li>You'll be automatically redirected to your client dashboard</li>
              <li>Configure your AI assistant's settings in the dashboard</li>
          </ol>
          
          <div style="margin: 30px 0;">
            <a href="${setupUrl}" style="
              background-color: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              display: inline-block;
              ">Sign In</a>
          </div>
          
          <p style="color: #666;">This invitation link will expire in 24 hours.</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
          
            <p>Best regards,<br>The ${agentName} Team</p>
        </div>
      `
    });

    if (emailError) {
        console.error("Error sending email:", emailError);
        return new Response(
          JSON.stringify({ error: "Failed to send email", details: emailError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Email sent successfully");
    return new Response(
      JSON.stringify({ 
        success: true,
          message: "Invitation sent successfully",
          data: { 
            email,
            clientName,
            agentName,
            expiresAt: expiresAt.toISOString()
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError) {
      console.error("Exception sending email:", emailError);
      return new Response(
        JSON.stringify({ error: "Email sending failed", details: emailError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
