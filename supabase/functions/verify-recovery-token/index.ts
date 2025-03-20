
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    // Get recovery token info using service role
    const { data: recoveryData, error: tokenError } = await supabase
      .from("client_recovery_tokens")
      .select(`
        *,
        clients:client_id (
          id,
          client_name,
          email
        )
      `)
      .eq("token", token)
      .single();

    if (tokenError || !recoveryData) {
      throw new Error("Invalid recovery token");
    }

    if (recoveryData.used_at) {
      throw new Error("This recovery link has already been used");
    }

    if (new Date(recoveryData.expires_at) < new Date()) {
      throw new Error("This recovery link has expired");
    }

    // Mark token as used
    await supabase
      .from("client_recovery_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", recoveryData.id);

    return new Response(
      JSON.stringify({
        clientId: recoveryData.client_id,
        clientName: recoveryData.clients.client_name,
        email: recoveryData.clients.email,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
