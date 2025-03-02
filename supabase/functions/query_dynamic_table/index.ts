
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { table_name, query_type, limit_count } = await req.json();

    // Validate input to prevent SQL injection
    if (!table_name.match(/^[a-z0-9_]+$/)) {
      return new Response(
        JSON.stringify({ error: "Invalid table name format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    let result;

    switch (query_type) {
      case "recent_interactions":
        // Execute a parameterized query
        const { data, error } = await supabaseClient.rpc(
          'execute_dynamic_query',
          { 
            query_sql: `SELECT id, content, metadata FROM "${table_name}" 
                        WHERE metadata->>'type' = 'chat_interaction' 
                        ORDER BY id DESC LIMIT $1`,
            param1: limit_count || 5
          }
        );
          
        if (error) throw error;
        result = data;
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: "Invalid query type" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
