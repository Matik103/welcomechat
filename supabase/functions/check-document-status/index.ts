
// @deno-types="https://deno.land/std@0.168.0/http/server.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { LlamaParseService } from "../_shared/LlamaParseService.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Parse the request body
    const { jobId, documentId } = await req.json();

    if (!jobId || !documentId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required parameters: jobId and documentId",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Checking document status for job ${jobId}, document ${documentId}`);

    // Initialize LlamaParseService
    const llamaParseService = new LlamaParseService({
      apiKey: Deno.env.get("LLAMA_CLOUD_API_KEY") || "",
    });

    // Check the status of the job
    const result = await llamaParseService.checkJobStatus(jobId);

    if (result.status === "success" && result.content) {
      // Update the document in the database with the content
      const { error: updateError } = await supabase
        .from("document_processing_jobs")
        .update({
          content: result.content,
          status: "completed",
          completed_at: new Date().toISOString(),
          metadata: { ...result.metadata }
        })
        .eq("id", documentId);

      if (updateError) {
        console.error("Error updating document:", updateError);
        throw new Error(`Failed to update document: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Document processing completed",
          status: "completed",
          documentId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Update the document with the error
      const { error: updateError } = await supabase
        .from("document_processing_jobs")
        .update({
          status: "failed",
          error: result.error || "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (updateError) {
        console.error("Error updating document status:", updateError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: "Document processing failed",
          error: result.error,
          status: "failed",
          documentId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Still return 200 to avoid retries
        }
      );
    }
  } catch (error) {
    console.error("Error checking document status:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Error checking document status",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
