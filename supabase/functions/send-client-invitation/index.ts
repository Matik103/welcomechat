import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface InvitationRequest {
  clientId: string;
  email: string;
  clientName: string;
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
      throw new Error("Invalid request format");
    }
    
    const { clientId, email, clientName } = requestBody as InvitationRequest;
    
    if (!clientId || !email) {
      console.error("Missing required parameters:", { clientId, email });
      throw new Error("Missing required parameters: clientId and email are required");
    }
    
    console.log(`Sending invitation to client: ${clientName || 'Unknown'} (${email}), ID: ${clientId}`);
    
    // Get the origin from request headers or use default
    const origin = req.headers.get("origin") || "https://welcome.chat";
    console.log("Using origin:", origin);
    
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey) {
      console.error("Missing required environment variables");
      throw new Error("Server configuration error: Missing required credentials");
    }
    
    console.log("Initializing clients with URL:", supabaseUrl);
    
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
    
    const resend = new Resend(resendApiKey);
    
    // Generate a unique token for the invitation
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours
    
    console.log("Attempting to store invitation in database...");
    
    // Store the invitation in the database
    const invitationData = {
      client_id: clientId,
      email: email,
      token: token,
      status: 'pending',
      expires_at: expiresAt.toISOString()
    };
    
    console.log("Invitation data:", invitationData);
    
    const { data: insertData, error: inviteError } = await supabaseAdmin
      .from('client_invitations')
      .insert([invitationData])
      .select()
      .single();
    
    if (inviteError) {
      console.error("Failed to store invitation:", inviteError);
      console.error("Error code:", inviteError.code);
      console.error("Error details:", inviteError.details);
      console.error("Error hint:", inviteError.hint);
      throw new Error(`Failed to create invitation record: ${inviteError.message}`);
    }
    
    console.log("Invitation stored successfully:", insertData);
    
    // Generate the verification URL with automatic login and redirect
    const verificationUrl = `${origin}/client-setup?token=${token}&redirect=/client/dashboard`;
    
    // Send email using Resend
    try {
      console.log("Attempting to send email via Resend...");
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Welcome.Chat <onboarding@welcome.chat>',
        to: email,
        subject: 'Access Your Welcome.Chat Dashboard',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Welcome.Chat!</h2>
            
            <p>Hello${clientName ? ` ${clientName}` : ''},</p>
            
            <p>Your Welcome.Chat dashboard is ready. Click the button below to access it instantly:</p>
            
            <div style="margin: 30px 0;">
              <a href="${verificationUrl}" style="
                background-color: #3b82f6;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
              ">Access Your Dashboard</a>
            </div>
            
            <p>With Welcome.Chat, you can:</p>
            <ul style="line-height: 1.6;">
              <li>Monitor your AI agent's performance</li>
              <li>View detailed analytics and insights</li>
              <li>Access conversation history</li>
              <li>Customize your settings</li>
            </ul>
            
            <p style="color: #666; font-size: 14px; margin-top: 40px;">
              This link will expire in 24 hours. If you didn't expect this invitation, you can safely ignore this email.
            </p>
            
            <p>Best regards,<br>The Welcome.Chat Team</p>
          </div>
        `
      });
      
      if (emailError) {
        console.error("Failed to send email:", emailError);
        throw emailError;
      }
      
      console.log("Email sent successfully:", emailData);
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
    
    // Return success
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
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Return with error information
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invitation",
        details: error.stack,
        success: false
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
