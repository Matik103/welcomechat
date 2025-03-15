
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-client-invitation function started");

    // Get the authorization header
    const authorization = req.headers.get('Authorization') || '';
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: { Authorization: authorization }
        }
      }
    );
    
    // Verify the user
    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.getUser();
    
    if (getUserError || !user) {
      console.error("Error getting user:", getUserError);
      throw new Error("Authentication required");
    }
    
    console.log(`Request made by user: ${user.email}`);
    
    // Check if the user is an admin (if required by your app)
    const { data: userRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    if (roleError) {
      console.error("Error checking user role:", roleError);
      // Continue anyway, but log the warning
    } else {
      const isAdmin = userRoles.some(r => r.role === 'admin');
      if (!isAdmin) {
        console.warn(`Warning: Non-admin user ${user.email} attempted to send invitation`);
        // For now, we'll allow the operation but log the warning
        // If you want to enforce admin-only, uncomment the next line:
        // throw new Error("Admin permission required");
      } else {
        console.log(`Confirmed admin user: ${user.email}`);
      }
    }

    // Parse request body
    const { clientId, email, clientName } = await req.json();
    
    console.log("Processing invitation for:", { email, clientName, clientId });
    
    if (!email || !clientName || !clientId) {
      throw new Error("Missing required parameters: email, clientName, and clientId are required");
    }
    
    // Check if client exists
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();
    
    if (clientError || !clientData) {
      console.error("Client not found:", clientError);
      throw new Error(`Client with ID ${clientId} not found`);
    }
    
    // Get the temporary password (if available)
    const { data: tempPasswordData, error: tempPasswordError } = await supabaseAdmin
      .from("client_temp_passwords")
      .select("temp_password")
      .eq("client_id", clientId)
      .eq("email", email)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    let tempPassword = "your temporary password";
    
    if (!tempPasswordError && tempPasswordData) {
      tempPassword = tempPasswordData.temp_password;
    } else {
      console.log("No temporary password found, using placeholder");
    }
    
    // Generate dashboard link (client will need to sign in first)
    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || '';
    const dashboardUrl = `${siteUrl}/client/dashboard`;
    
    // For new users, we need them to create their account first
    // Generate password reset link that will allow them to sign in
    const { data: passwordResetData, error: passwordResetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${siteUrl}/client/dashboard`
      }
    });
    
    if (passwordResetError) {
      console.error("Error generating password reset link:", passwordResetError);
      throw passwordResetError;
    }
    
    const resetLink = passwordResetData?.properties?.action_link || dashboardUrl;
    console.log("Generated reset link");

    // Send email via Resend API
    try {
      console.log("Attempting to send email via Resend API");
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      
      if (!resendApiKey) {
        throw new Error("RESEND_API_KEY is not set");
      }
      
      const resend = new Resend(resendApiKey);
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Welcome.Chat <admin@welcome.chat>",
        to: [email],
        subject: `Welcome to TestBot Assistant!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h1 style="color: #333;">Welcome to TestBot Assistant!</h1>
            <p>Hello ${clientName},</p>
            <p>You have been invited to create your account for TestBot Assistant. Your AI assistant has been set up and is ready for you to configure.</p>
            <p><strong>Your temporary password is: ${tempPassword}</strong></p>
            <p>To complete your account setup:</p>
            <ol>
              <li>Click the button below to sign in</li>
              <li>Use your email (${email}) and temporary password to log in</li>
              <li>You'll be automatically redirected to your client dashboard</li>
              <li>Configure your AI assistant's settings in the dashboard</li>
            </ol>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Sign In</a>
            </div>
            <p>This invitation link will expire in 24 hours.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>Best regards,<br>The TestBot Assistant Team</p>
          </div>
        `
      });
      
      if (emailError) {
        console.error("Resend API error:", emailError);
        throw new Error(`Resend API error: ${JSON.stringify(emailError)}`);
      }
      
      console.log("Email sent successfully via Resend API");
      
    } catch (resendError) {
      console.error("Failed to send email via Resend:", resendError);
      throw resendError;
    }
    
    // Log client activity
    const { error: activityError } = await supabaseAdmin
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: "invitation_sent",
        description: `Invitation email sent to ${email}`,
        metadata: {
          email,
          sent_by: user.email
        }
      });
    
    if (activityError) {
      console.error("Error logging client activity:", activityError);
      // Continue anyway, as the email was sent successfully
    }

    console.log("Invitation process completed successfully");
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation email sent successfully" 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in send-client-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to send invitation email"
      }),
      { 
        status: 200, // Using 200 to avoid CORS issues
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
