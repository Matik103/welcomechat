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

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") as string;
  
  // If no PUBLIC_SITE_URL is set, default to a localhost URL
  const baseUrl = publicSiteUrl || "http://localhost:5173";
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { clientId, email, clientName }: InvitationRequest = await req.json();
    
    if (!clientId || !email || !clientName) {
      throw new Error("Missing required parameters: clientId, email, or clientName");
    }

    console.log(`Creating invitation for client ${clientName} (${clientId}) with email: ${email}`);
    
    // Check if there's an existing invitation
    const { data: existingInvitation } = await supabase
      .from("client_invitations")
      .select("*")
      .eq("client_id", clientId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();
    
    // Generate a new token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days
    
    // If there's an existing invitation, update it
    if (existingInvitation) {
      const { error: updateError } = await supabase
        .from("client_invitations")
        .update({
          token: token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", existingInvitation.id);
      
      if (updateError) throw updateError;
    } else {
      // Otherwise, create a new invitation
      const { error: insertError } = await supabase
        .from("client_invitations")
        .insert({
          client_id: clientId,
          email: email,
          token: token,
          status: "pending",
          expires_at: expiresAt.toISOString()
        });
      
      if (insertError) throw insertError;
    }
    
    // Generate setup URL
    const setupUrl = `${baseUrl}/client/setup?token=${token}`;
    
    // Send the invitation email
    console.log("Sending invitation email with setup URL:", setupUrl);
    const { error: emailError } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject: `Setup Your ${clientName} AI Assistant Account`,
        html: `
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
        `
      },
    });

    if (emailError) {
      throw new Error(`Error sending invitation email: ${emailError.message}`);
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
        error: error.message || "Failed to send invitation"
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
