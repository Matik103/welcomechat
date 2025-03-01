
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { v4 as uuidv4 } from "https://deno.land/std@0.190.0/uuid/mod.ts";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables for Supabase");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    let body: InvitationRequest;
    try {
      body = await req.json();
      console.log("Received request body:", body);
    } catch (error) {
      console.error("Error parsing request JSON:", error);
      throw new Error("Invalid JSON in request body");
    }
    
    const { clientId, email, clientName } = body;
    
    if (!clientId || !email || !clientName) {
      throw new Error("Missing required parameters: clientId, email, or clientName");
    }

    console.log(`Creating invitation for client ${clientName} (${clientId}) with email: ${email}`);
    
    // Generate a new token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days
    
    // Check if there's an existing invitation
    const { data: existingInvitation, error: lookupError } = await supabase
      .from("client_invitations")
      .select("*")
      .eq("client_id", clientId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();
    
    if (lookupError) {
      console.error("Error looking up existing invitations:", lookupError);
    }
    
    // Store the invitation in the database
    try {
      if (existingInvitation) {
        console.log("Updating existing invitation");
        const { error: updateError } = await supabase
          .from("client_invitations")
          .update({
            token: token,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", existingInvitation.id);
        
        if (updateError) {
          console.error("Error updating invitation:", updateError);
          throw updateError;
        }
      } else {
        console.log("Creating new invitation");
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
          console.error("Error inserting invitation:", insertError);
          throw insertError;
        }
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    // Generate setup URL
    // Try to get the base URL from different sources
    const origin = req.headers.get("origin");
    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL");
    const baseUrl = publicSiteUrl || origin || "https://interact-metrics-oasis.lovable.app";
    
    const setupUrl = `${baseUrl}/client/setup?token=${token}`;
    console.log("Generated setup URL:", setupUrl);
    
    // Send the invitation email
    try {
      console.log("Preparing to send invitation email");
      const emailHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h1>Welcome to Your AI Assistant Dashboard!</h1>
            <p>Hello,</p>
            <p>You have been invited to set up your ${clientName} AI Assistant dashboard account.</p>
            <p>Click the button below to complete your account setup:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${setupUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Complete Account Setup
              </a>
            </div>
            <p>This link will expire in 7 days. If you have any questions, please contact your administrator.</p>
            <p>Best regards,<br>AI Assistant Team</p>
            <p style="font-size: 0.8rem; color: #718096; margin-top: 40px;">
              If the button above doesn't work, copy and paste this URL into your browser:<br>
              ${setupUrl}
            </p>
          </body>
        </html>
      `;
      
      console.log("Invoking send-email function");
      const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
        "send-email", 
        { 
          body: {
            to: email,
            subject: `Setup Your ${clientName} AI Assistant Account`,
            html: emailHtml
          } 
        }
      );

      if (emailError) {
        console.error("Error from send-email function:", emailError);
        throw new Error(`Failed to send invitation email: ${JSON.stringify(emailError)}`);
      }
      
      if (emailResponse && emailResponse.error) {
        console.error("Error in email response:", emailResponse.error);
        throw new Error(`Email service error: ${emailResponse.error}`);
      }

      console.log("Invitation email sent successfully");
    } catch (emailError) {
      console.error("Exception sending invitation email:", emailError);
      throw new Error(`Email sending failed: ${emailError.message}`);
    }

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
        error: error.message || "Failed to send invitation",
        stack: error.stack
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
