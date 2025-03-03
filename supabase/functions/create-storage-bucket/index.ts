
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create the "logos" bucket if it doesn't exist
    const { data: existingBuckets } = await supabaseAdmin.storage.listBuckets();
    const logosBucketExists = existingBuckets?.some(bucket => bucket.name === "logos");

    if (!logosBucketExists) {
      const { data, error } = await supabaseAdmin.storage.createBucket("logos", {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
        allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/svg+xml"]
      });

      if (error) throw error;
      
      console.log("Created 'logos' bucket:", data);
    } else {
      console.log("'logos' bucket already exists");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Storage bucket setup completed"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in create-storage-bucket function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to create storage bucket" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
