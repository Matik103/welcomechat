
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.1";

// Create a Supabase client with the Auth context of the function
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    console.log("Verifying recovery token:", token);

    // Get the recovery token details
    const { data: tokenData, error: tokenError } = await supabase
      .from("client_recovery_tokens")
      .select("id, client_id, created_at, expires_at, used_at")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      console.error("Invalid or expired recovery token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired recovery token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if token has already been used
    if (tokenData.used_at) {
      console.log("Token has already been used:", tokenData.used_at);
      return new Response(
        JSON.stringify({ error: "This recovery link has already been used" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.log("Token has expired:", tokenData.expires_at);
      return new Response(
        JSON.stringify({ error: "This recovery link has expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get client details
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", tokenData.client_id)
      .single();

    if (clientError || !clientData) {
      console.error("Client not found:", clientError);
      return new Response(
        JSON.stringify({ error: "Client not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log("Recovering client:", clientData.client_name);

    // Update client status to active
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        status: "active",
        deletion_scheduled_at: null
      })
      .eq("id", tokenData.client_id);

    if (updateError) {
      console.error("Failed to recover client account:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to recover client account" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Mark token as used
    await supabase
      .from("client_recovery_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    // Log client recovery activity
    await supabase
      .from("client_activities")
      .insert({
        client_id: tokenData.client_id,
        activity_type: "client_recovered",
        description: `Client ${clientData.client_name} was recovered from scheduled deletion`,
        metadata: {
          recovery_token_id: tokenData.id,
          client_name: clientData.client_name,
          client_email: clientData.email,
          recovered_at: new Date().toISOString()
        }
      });

    console.log("Client successfully recovered");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Client account recovered successfully",
        clientName: clientData.client_name 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in verify-recovery-token:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
