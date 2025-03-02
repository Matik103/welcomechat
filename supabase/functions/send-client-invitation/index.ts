
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  clientId: string;
  email: string;
  clientName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, email, clientName }: InvitationRequest = await req.json();
    
    if (!clientId || !email || !clientName) {
      throw new Error("Missing required data: clientId, email, or clientName");
    }
    
    console.log(`Sending client invitation to ${email} for client: ${clientName}`);
    
    // Generate a unique setup token - just using a timestamp+random for simplicity
    const setupToken = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Store the token in the database
    const { error: updateError } = await supabase
      .from('clients')
      .update({ 
        setup_token: setupToken,
        setup_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .eq('id', clientId);
      
    if (updateError) {
      throw new Error(`Failed to store setup token: ${updateError.message}`);
    }
    
    // Generate the setup URL
    const setupUrl = `${req.headers.get('origin')}/client/setup?token=${setupToken}`;
    
    // Prepare the invitation email
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h1>Welcome to AI Assistant!</h1>
          <p>Dear ${clientName},</p>
          <p>You've been invited to set up your AI Assistant account.</p>
          <p>Click the button below to get started:</p>
          <div style="margin: 30px 0;">
            <a href="${setupUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Set Up Your Account
            </a>
          </div>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="font-size: 14px; color: #666;">
            <a href="${setupUrl}">${setupUrl}</a>
          </p>
          <p>This link will expire in 7 days.</p>
          <p>Best regards,<br>The AI Assistant Team</p>
        </body>
      </html>
    `;
    
    // Send the invitation email
    const emailResponse = await resend.emails.send({
      from: "AI Assistant <admin@welcome.chat>", // Using the specified from email
      to: [email],
      subject: "Your AI Assistant Invitation",
      html: emailHtml,
    });
    
    console.log("Invitation email sent successfully:", emailResponse);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-client-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error", success: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
