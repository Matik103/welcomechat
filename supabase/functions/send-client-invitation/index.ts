
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
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
}

// Initialize clients with proper error handling
function initializeClients() {
  console.log("Initializing clients...");
  
  // Initialize Resend for email sending
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("Missing Resend API key");
    throw new Error("Resend API key not configured");
  }
  
  const resend = new Resend(resendApiKey);
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials");
    throw new Error("Supabase credentials are not properly configured");
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  return { resend, supabase };
}

// Parse and validate request body
async function parseRequestBody(req: Request): Promise<InvitationRequest> {
  try {
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body));
    
    const { clientId, email, clientName } = body;
    
    if (!clientId || !email || !clientName) {
      console.error("Missing required parameters", { clientId, email, clientName });
      throw new Error("Missing required parameters");
    }
    
    return { clientId, email, clientName };
  } catch (e) {
    console.error("Error parsing JSON:", e);
    throw new Error("Invalid JSON in request body");
  }
}

// Manage invitation record in database
async function manageInvitationRecord(supabase: any, clientId: string, email: string, token: string, expiresAt: Date) {
  // Check for existing invitations
  const { data: existingInvitation, error: checkError } = await supabase
    .from("client_invitations")
    .select("*")
    .eq("client_id", clientId)
    .eq("email", email)
    .maybeSingle();
    
  if (checkError) {
    console.error("Error checking existing invitations:", checkError);
  }
  
  // Either update existing or create new invitation
  if (existingInvitation) {
    console.log("Updating existing invitation for:", email);
    const { error: updateError } = await supabase
      .from("client_invitations")
      .update({
        token: token,
        status: "pending",
        expires_at: expiresAt.toISOString()
      })
      .eq("id", existingInvitation.id);
      
    if (updateError) {
      console.error("Failed to update invitation:", updateError);
      throw new Error(`Failed to update invitation: ${updateError.message}`);
    }
  } else {
    // Create a new invitation
    console.log("Creating new invitation for:", email);
    const { error: insertError } = await supabase
      .from("client_invitations")
      .insert({
        client_id: clientId,
        email: email,
        token: token,
        status: "pending",
        expires_at: expiresAt.toISOString()
      });
      
    if (insertError) {
      console.error("Failed to create invitation:", insertError);
      throw new Error(`Failed to create invitation: ${insertError.message}`);
    }
  }
}

// Send email with setup link
async function sendSetupEmail(resend: any, email: string, clientName: string, setupUrl: string) {
  console.log("Attempting to send email to:", email);
  const { data: emailData, error: emailError } = await resend.emails.send({
    from: "Welcome.Chat <admin@welcome.chat>",
    to: email,
    subject: `${clientName} AI Assistant - Complete Your Setup`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4f46e5;">Welcome to Your AI Assistant!</h1>
          </div>
          <p>Hello,</p>
          <p>Your AI Assistant account for <strong>${clientName}</strong> has been created. To complete your setup:</p>
          <div style="background-color: #f9fafb; border-radius: 5px; padding: 20px; margin: 20px 0;">
            <p style="font-weight: bold; margin-bottom: 15px;">Please click the button below to set up your password and access your dashboard:</p>
            <a href="${setupUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Setup</a>
            <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">This link will expire in 24 hours.</p>
          </div>
          <p>After setting your password, you'll be able to access your AI Assistant dashboard where you can manage your settings and chat history.</p>
          <p>If you didn't request this account, please ignore this email.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
            <p>Best regards,<br>The ${clientName} Team</p>
          </div>
        </body>
      </html>
    `
  });
  
  if (emailError) {
    console.error("Error sending email:", emailError);
    throw new Error(`Failed to send invitation email: ${emailError.message}`);
  }
  
  console.log("Email sent successfully:", emailData);
  return emailData;
}

// Log activity in the database
async function logActivity(supabase: any, clientId: string, email: string, expiresAt: Date) {
  try {
    const { error: activityError } = await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: "client_updated", // Using a valid existing activity type
        description: "Invitation sent to client",
        metadata: {
          email: email,
          invitation_sent: true,
          expiration_date: expiresAt.toISOString()
        }
      });
      
    if (activityError) {
      console.error("Error logging invitation activity:", activityError);
      // Don't throw here, we still want to return success even if activity logging fails
    }
  } catch (activityError) {
    console.error("Exception in activity logging:", activityError);
    // Continue execution, as this is not a critical error
  }
}

// Main handler function
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
    
    // Initialize clients
    const { resend, supabase } = initializeClients();
    
    // Parse request body
    const { clientId, email, clientName } = await parseRequestBody(req);
    
    console.log(`Processing invitation for client: ${clientName}, email: ${email}, id: ${clientId}`);
    
    // Generate a secure random token
    const token = crypto.randomUUID();
    
    // Set expiration date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Manage invitation record in database
    await manageInvitationRecord(supabase, clientId, email, token, expiresAt);
    
    // Generate the setup URL with the token
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "http://localhost:5173";
    const setupUrl = `${baseUrl}/client/setup?token=${token}`;
    
    console.log("Generated setup URL:", setupUrl);
    
    // Send the direct setup email
    try {
      await sendSetupEmail(resend, email, clientName, setupUrl);
    } catch (emailError: any) {
      console.error("Exception sending email:", emailError);
      throw new Error(`Email sending failed: ${emailError.message}`);
    }
    
    // Log the activity
    await logActivity(supabase, clientId, email, expiresAt);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully" 
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in send-client-invitation function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invitation" 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
