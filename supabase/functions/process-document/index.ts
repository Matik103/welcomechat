
// @deno-types="https://deno.land/std@0.168.0/http/server.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { LlamaParseService } from "../_shared/LlamaParseService.ts";
import { FirecrawlService } from "../_shared/FirecrawlService.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize services
const llamaParseService = new LlamaParseService({
  apiKey: Deno.env.get("LLAMA_CLOUD_API_KEY") || "",
});

const firecrawlService = new FirecrawlService({
  apiKey: Deno.env.get("FIRECRAWL_API_KEY") || "",
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Parse the request body
    const { documentId, url, type, clientId, callbackUrl } = await req.json();

    if (!documentId || !url) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required parameters: documentId and url",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Processing document (ID: ${documentId}, type: ${type}, URL: ${url})`);

    // Update document status to processing
    const { error: updateError } = await supabase
      .from("document_processing_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Error updating document status:", updateError);
      throw new Error(`Failed to update document status: ${updateError.message}`);
    }

    let result;
    let statusCheckEndpoint = `${Deno.env.get("SUPABASE_URL")}/functions/v1/check-document-status`;
    
    if (type === "document") {
      // Process document with LlamaParse
      console.log(`Processing document with LlamaParse: ${url}`);
      result = await llamaParseService.processDocument({
        url,
        metadata: {
          documentId,
          clientId,
          type,
        },
        callbackUrl,
      });
    } else if (type === "website") {
      // Process website with Firecrawl
      console.log(`Processing website with Firecrawl: ${url}`);
      result = await firecrawlService.crawlWebsite({
        url,
        maxPages: 50,
        maxDepth: 2,
      });
    } else {
      throw new Error(`Unsupported document type: ${type}`);
    }

    if ((result.status === "success" && result.jobId) || 
        (type === "website" && result.success && result.data?.jobId)) {
      const jobId = result.jobId || (result.data?.jobId);
      
      // Update document with job ID
      const { error } = await supabase
        .from("document_processing_jobs")
        .update({
          job_id: jobId,
          status: "queued",
        })
        .eq("id", documentId);

      if (error) {
        console.error("Error updating document with job ID:", error);
        throw new Error(`Failed to update document with job ID: ${error.message}`);
      }

      // If no callback URL provided, schedule a status check
      if (!callbackUrl) {
        // Schedule a status check in 10 seconds
        setTimeout(async () => {
          try {
            const response = await fetch(statusCheckEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                jobId,
                documentId,
              }),
            });
            
            if (!response.ok) {
              console.error(`Failed to check status: ${response.status} ${response.statusText}`);
            }
          } catch (error) {
            console.error("Error scheduling status check:", error);
          }
        }, 10000);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Document processing started",
          jobId,
          documentId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Update document with error
      const { error } = await supabase
        .from("document_processing_jobs")
        .update({
          status: "failed",
          error: (result.error || "Failed to start processing") as string,
          completed_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (error) {
        console.error("Error updating document with error:", error);
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to start document processing",
          error: result.error || "Unknown error",
          documentId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error("Error processing document:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Error processing document",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
