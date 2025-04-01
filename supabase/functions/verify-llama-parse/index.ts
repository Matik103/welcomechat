
// @deno-types="https://deno.land/std@0.168.0/http/server.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { LlamaParseService } from "../_shared/LlamaParseService.ts";

// Initialize LlamaParseService
const llamaParseService = new LlamaParseService({
  apiKey: Deno.env.get("LLAMA_CLOUD_API_KEY") || "",
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Create a simple test document content
    const testContent = "This is a test document to verify LlamaParse integration.";
    const timestamp = new Date().toISOString();

    // Attempt to use LlamaParse API to verify integration
    const testUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

    console.log(`Verifying LlamaParse integration at ${timestamp}`);
    console.log(`Using test URL: ${testUrl}`);

    // Try to process the sample document
    const result = await llamaParseService.processDocument({
      url: testUrl,
      metadata: {
        verification: true,
        timestamp
      }
    });

    if (result.status === "success") {
      console.log("LlamaParse integration verified successfully!");
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "LlamaParse integration is working correctly",
          details: {
            timestamp,
            apiStatus: "available",
            responseReceived: true,
            contentLength: result.content ? result.content.length : 0,
            metadata: result.metadata
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      console.error("LlamaParse integration verification failed:", result.error);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "LlamaParse integration verification failed",
          error: result.error,
          details: {
            timestamp,
            apiStatus: "error",
            errorMessage: result.error
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error("Error verifying LlamaParse integration:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error verifying LlamaParse integration",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
