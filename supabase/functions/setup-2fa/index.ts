
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { authenticator } from "https://deno.land/x/otpauth@v9.0.1/dist/otpauth.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get client_id from request body
    const { client_id } = await req.json();
    if (!client_id) {
      throw new Error("client_id is required");
    }

    // Generate TOTP secret
    const secret = authenticator.generateSecret();
    
    // Get client info for the OTP label
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("client_name, email")
      .eq("id", client_id)
      .single();

    if (clientError) throw clientError;

    // Create OTP URL
    const otp = new authenticator.TOTP({
      secret,
      label: client.email,
      issuer: "AI Agent Dashboard",
    });

    // Generate QR code URL
    const qrCode = otp.toString();

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substr(2, 9)
    );

    // Save secret and backup codes
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        two_factor_secret: secret,
        backup_codes: backupCodes,
      })
      .eq("id", client_id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        qrCode,
        backupCodes,
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
