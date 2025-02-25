
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple base32 encoding implementation
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Encode(buffer: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

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

    // Get client info for the OTP label
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("client_name, email")
      .eq("id", client_id)
      .single();

    if (clientError) throw clientError;

    // Generate TOTP secret (20 bytes = 160 bits, standard for TOTP)
    const secretBytes = new Uint8Array(20);
    crypto.getRandomValues(secretBytes);
    const secret = base32Encode(secretBytes);

    // Create OTP URL
    const issuer = encodeURIComponent("AI Agent Dashboard");
    const accountName = encodeURIComponent(client.email);
    const qrCode = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomUUID().slice(0, 8)
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

    console.log("Successfully set up 2FA for client:", client_id);

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
    console.error("Error in setup-2fa function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
