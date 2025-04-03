import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RATE_LIMIT_REQUESTS = parseInt(Deno.env.get("RATE_LIMIT_REQUESTS") ?? "100");
const RATE_LIMIT_WINDOW = parseInt(Deno.env.get("RATE_LIMIT_WINDOW") ?? "60"); // seconds

interface RateLimitInfo {
  remaining: number;
  reset: number;
  total: number;
}

export const checkRateLimit = async (
  clientId: string,
  functionName: string
): Promise<RateLimitInfo> => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Get request count for this client in the current window
  const { count } = await supabase
    .from("function_metrics")
    .select("id", { count: "exact" })
    .eq("client_id", clientId)
    .eq("function_name", functionName)
    .gte("created_at", new Date(windowStart * 1000).toISOString());

  const requestCount = count ?? 0;
  const remaining = Math.max(0, RATE_LIMIT_REQUESTS - requestCount);
  const reset = windowStart + RATE_LIMIT_WINDOW;

  // Log this request
  if (remaining > 0) {
    await supabase.from("function_metrics").insert({
      client_id: clientId,
      function_name: functionName,
      request_path: functionName,
      status_code: 200,
    });
  }

  return {
    remaining,
    reset,
    total: RATE_LIMIT_REQUESTS,
  };
};

export const getRateLimitHeaders = (rateLimitInfo: RateLimitInfo): Headers => {
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", rateLimitInfo.total.toString());
  headers.set("X-RateLimit-Remaining", rateLimitInfo.remaining.toString());
  headers.set("X-RateLimit-Reset", rateLimitInfo.reset.toString());
  return headers;
}; 