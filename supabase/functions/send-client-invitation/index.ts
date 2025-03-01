
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { clientId, clientEmail, clientName } = await req.json();

    console.log(`Processing invitation for client ${clientName} (${clientEmail}), ID: ${clientId}`);

    if (!clientId || !clientEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clientId, clientEmail' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create a token for the invitation
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    console.log('Checking for existing invitation...');
    
    // Check if there's an existing invitation
    const { data: existingInvitation, error: checkError } = await supabase
      .from('client_invitations')
      .select('*')
      .eq('client_id', clientId)
      .eq('email', clientEmail)
      .eq('status', 'pending')
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking existing invitation:', checkError);
      return new Response(
        JSON.stringify({ error: `Database error: ${checkError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Handle existing invitation
    if (existingInvitation) {
      console.log('Found existing invitation, updating token and expiry date');
      
      const { error: updateError } = await supabase
        .from('client_invitations')
        .update({
          token: token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInvitation.id);
        
      if (updateError) {
        console.error('Error updating invitation:', updateError);
        return new Response(
          JSON.stringify({ error: `Database error: ${updateError.message}` }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    } else {
      console.log('Creating new invitation record');
      
      // Create new invitation
      const { error: insertError } = await supabase
        .from('client_invitations')
        .insert({
          client_id: clientId,
          email: clientEmail,
          token: token,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        });
        
      if (insertError) {
        console.error('Error creating invitation:', insertError);
        return new Response(
          JSON.stringify({ error: `Database error: ${insertError.message}` }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    // Construct the invitation URL
    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:5173';
    const invitationUrl = `${baseUrl}/client/setup?token=${token}`;

    console.log('Sending invitation email...');
    
    // Send the invitation email using the send-email function
    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          to: clientEmail,
          from: 'AI Assistant <admin@welcome.chat>',
          subject: 'Invitation to AI Assistant Dashboard',
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h1>Welcome to the AI Assistant Dashboard!</h1>
                <p>Hello ${clientName || 'Client'},</p>
                <p>You have been invited to set up your AI Assistant dashboard account.</p>
                <p>Please click the link below to complete your account setup:</p>
                <p>
                  <a href="${invitationUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                    Complete Your Setup
                  </a>
                </p>
                <p>This invitation link will expire in 7 days.</p>
                <p>If you have any questions, please contact your administrator.</p>
                <p>Best regards,<br>AI Assistant Team</p>
              </body>
            </html>
          `
        })
      });

      const emailData = await emailResponse.json();
      console.log('Email send response:', JSON.stringify(emailData));
      
      if (!emailResponse.ok) {
        console.error('Error sending email:', emailData);
        return new Response(
          JSON.stringify({ 
            status: 'partial_success', 
            message: 'Invitation created but email failed to send', 
            emailError: emailData.error
          }),
          { status: 207, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    } catch (emailError) {
      console.error('Exception sending invitation email:', emailError);
      return new Response(
        JSON.stringify({ 
          status: 'partial_success', 
          message: 'Invitation created but email failed to send', 
          emailError: emailError.message
        }),
        { status: 207, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully',
        invitationUrl
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Unexpected error in send-client-invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
