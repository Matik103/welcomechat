
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface InvitationRequest {
  clientId: string;
  email: string;
  clientName: string;
  defaultPassword?: string;
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
    
    // Parse request body early to catch JSON parsing errors
    let requestData: InvitationRequest;
    try {
      requestData = await req.json();
      console.log(`Request received for client: ${requestData.clientName} (${requestData.email})`);
    } catch (jsonError) {
      console.error("Failed to parse request JSON:", jsonError);
      return new Response(
        JSON.stringify({ error: "Invalid request format" }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const { clientId, email, clientName, defaultPassword } = requestData;
    
    // Validate required fields
    if (!clientId || !email || !clientName) {
      const missingFields = [];
      if (!clientId) missingFields.push("clientId");
      if (!email) missingFields.push("email");
      if (!clientName) missingFields.push("clientName");
      
      console.error(`Missing required fields: ${missingFields.join(", ")}`);
      return new Response(
        JSON.stringify({ error: `Missing required fields: ${missingFields.join(", ")}` }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Validate Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("ERROR: Missing RESEND_API_KEY environment variable");
      return new Response(
        JSON.stringify({ error: "Email service not properly configured" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Validate Supabase connection details
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Database service not properly configured" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Create Supabase client for admin operations
    console.log("Creating Supabase admin client");
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log("Initializing Resend client");
    const resend = new Resend(resendApiKey);
    
    console.log(`Sending invitation to client: ${clientName} (${email})`);
    
    // Generate the dashboard URL - where clients will access their dashboard
    const origin = req.headers.get("origin") || "https://welcome.chat";
    const dashboardUrl = `${origin}/client/view`;
    
    console.log(`Dashboard URL: ${dashboardUrl}`);
    
    // Generate a default password if one wasn't provided
    const password = defaultPassword || `welcome${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`Generated password: ${password.substring(0, 3)}***`); // Log partially obscured password for security
    
    // Important: Create or update user BEFORE sending email
    let authSuccess = false;
    let userId = null;
    
    try {
      // First check if user exists
      console.log("Checking if user exists:", email);
      const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      
      if (getUserError) {
        // Only log the error, but continue with the flow if it's a "User not found" error
        console.error("Error checking if user exists:", getUserError);
        
        // If it's not a "User not found" error, handle accordingly
        if (!getUserError.message.includes("User not found")) {
          return new Response(
            JSON.stringify({ error: `Authentication error: ${getUserError.message}` }), 
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
      }
      
      if (existingUser) {
        console.log("User exists, updating password...");
        userId = existingUser.id;
        
        // Update existing user's password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: password,
          email_confirm: true,
          user_metadata: {
            client_id: clientId
          }
        });
        
        if (updateError) {
          console.error("Error updating user password:", updateError);
          return new Response(
            JSON.stringify({ error: `Failed to update password: ${updateError.message}` }), 
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
        console.log("Password updated successfully for existing user");
        authSuccess = true;
      } else {
        console.log("User doesn't exist, creating new user...");
        // Create new user with the generated password
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true, // Skip email confirmation
          user_metadata: {
            client_id: clientId
          }
        });
        
        if (createError) {
          console.error("Error creating user:", createError);
          return new Response(
            JSON.stringify({ error: `Failed to create user: ${createError.message}` }), 
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
        
        if (!newUser || !newUser.user) {
          console.error("User creation succeeded but no user data returned");
          return new Response(
            JSON.stringify({ error: "User creation succeeded but no user data returned" }), 
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
        
        userId = newUser.user.id;
        console.log("New user created successfully with ID:", userId);
        authSuccess = true;
      }
    } catch (authError) {
      console.error("Error in authentication process:", authError);
      return new Response(
        JSON.stringify({ error: `Authentication error: ${authError.message || "Unknown error"}` }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    if (!authSuccess) {
      console.error("Authentication process failed without throwing an error");
      return new Response(
        JSON.stringify({ error: "Failed to create or update user authentication" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log("User authentication successful, preparing email");
    
    // Updated email content with dashboard link and login credentials
    const htmlContent = `
      <h1>Welcome to Welcome.Chat, Your Agent!</h1>
      <p>Your account has been created. Here are your login credentials:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Click the button below to access your dashboard:</p>
      <p><a href="${dashboardUrl}" style="display: inline-block; background-color: #6366F1; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-family: Arial, sans-serif;">Access Your Dashboard</a></p>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${dashboardUrl}</p>
      <p><strong>Important:</strong> For security reasons, please change your password after logging in. You can do this in your account settings.</p>
      <p>Thank you,<br>The Welcome.Chat Team</p>
    `;
    
    // Send the email
    console.log("Sending email via Resend...");
    try {
      const { data, error } = await resend.emails.send({
        from: "Welcome.Chat <noreply@welcome.chat>",
        to: email,
        subject: "Welcome to Welcome.Chat - Your Login Credentials",
        html: htmlContent
      });
      
      if (error) {
        console.error("Error from Resend API:", error);
        return new Response(
          JSON.stringify({ error: `Failed to send email: ${error.message || "Unknown error"}` }), 
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      console.log("Invitation email sent successfully:", data);
    } catch (emailError) {
      console.error("Exception in email sending:", emailError);
      return new Response(
        JSON.stringify({ error: `Email sending failed: ${emailError.message || "Unknown error"}` }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Return the password in the response so it can be saved in the database if needed
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation email sent successfully",
        password: password,
        userId: userId
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Unhandled error in send-client-invitation function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invitation",
        stack: Deno.env.get("ENVIRONMENT") === "development" ? error.stack : undefined
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
