
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing client invitation request");
    
    // Parse request
    const requestData = await req.json();
    console.log("Received request data:", JSON.stringify(requestData, null, 2));
    
    const { clientId, email, clientName } = requestData;
    
    if (!clientId || !email) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "clientId and email are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing invitation for client: ${clientId}, email: ${email}`);

    // Generate unique token and expiration date (30 days from now)
    const token = uuidv4();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Step 1: Create invitation record in database first
    console.log("Creating invitation record in database");
    const { data: invitationData, error: invitationError } = await supabase
      .from("client_invitations")
      .insert({
        client_id: clientId,
        email: email,
        token: token,
        expires_at: expiryDate.toISOString(),
        status: "pending",
      })
      .select('*')
      .single();

    if (invitationError) {
      console.error("Error creating invitation record:", invitationError);
      return new Response(
        JSON.stringify({ error: `Database error: ${invitationError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Invitation created in database:", invitationData);

    // Step 2: Generate setup URL for the email
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || supabaseUrl.replace("https://", "https://app.");
    const setupUrl = `${baseUrl}/client/setup?token=${token}`;
    
    console.log("Generated setup URL:", setupUrl);
    
    // Step 3: Send the invitation email
    console.log("Preparing to send invitation email");
    
    try {
      const emailContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; border: 1px solid #dee2e6;">
              <h1 style="color: #333;">Welcome to Your AI Assistant Dashboard!</h1>
              <p>Hello,</p>
              <p>You've been invited to join the ${clientName} AI Assistant dashboard.</p>
              <p>Click the button below to set up your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${setupUrl}" style="background-color: #854fff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Set Up Your Account</a>
              </div>
              <p>Or copy and paste this URL into your browser:</p>
              <p style="background-color: #eee; padding: 10px; border-radius: 4px; word-break: break-all;">${setupUrl}</p>
              <p>This link will expire in 30 days.</p>
              <p>Best regards,<br>AI Assistant Team</p>
            </div>
          </body>
        </html>
      `;

      console.log("Sending email via send-email function");
      
      const emailResponse = await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          subject: `Welcome to ${clientName} AI Assistant - Account Setup`,
          html: emailContent,
        },
      });

      if (emailResponse.error) {
        console.error("Error from send-email function:", emailResponse.error);
        
        // We don't return error here since the invitation was created successfully
        // Just log the error and return a partial success
        return new Response(
          JSON.stringify({
            success: true,
            invitation_created: true,
            email_sent: false,
            message: "Invitation created but email failed to send",
            error: emailResponse.error
          }),
          {
            status: 207, // Partial success
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("Email sent successfully");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Invitation sent successfully",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (emailError) {
      console.error("Exception sending email:", emailError);
      
      // Return partial success since invitation was created
      return new Response(
        JSON.stringify({
          success: true,
          invitation_created: true,
          email_sent: false,
          message: "Invitation created but email failed to send",
          error: emailError.message
        }),
        {
          status: 207, // Partial success
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in send-client-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
