import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { LlamaParseService } from "../../../src/services/LlamaParseService.ts";
import { FirecrawlService } from "../../../src/services/FirecrawlService.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize services
const llamaParseService = new LlamaParseService({
  apiKey: Deno.env.get("LLAMA_CLOUD_API_KEY") || "",
});

const firecrawlService = new FirecrawlService({
  apiKey: Deno.env.get("FIRECRAWL_API_KEY") || "",
});

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Parse request body
    const { clientId, documentType, documentUrl, agentName } = await req.json();

    // Validate required fields
    if (!clientId || !documentType || !documentUrl || !agentName) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: clientId, documentType, documentUrl, and agentName are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Create a processing job
    const { data: job, error: jobError } = await supabaseClient.rpc(
      "process_document",
      {
        p_client_id: clientId,
        p_agent_name: agentName,
        p_document_url: documentUrl,
        p_document_type: documentType,
      }
    );

    if (jobError) {
      throw jobError;
    }

    // Process the document based on type
    if (documentType === "url" || documentType === "web_page") {
      // Use Firecrawl for website crawling
      const crawlResult = await firecrawlService.crawlWebsite({
        url: documentUrl,
        maxDepth: 2,
        limit: 100,
        onlyMainContent: true,
      });

      if (!crawlResult.success) {
        // Update job status to failed
        await supabaseClient.rpc("update_document_processing_status", {
          p_job_id: job,
          p_status: "failed",
          p_error: crawlResult.error,
        });

        throw new Error(crawlResult.error || "Failed to crawl website");
      }

      // Start polling for crawl results
      const pollInterval = setInterval(async () => {
        const status = await firecrawlService.getCrawlStatus(crawlResult.data?.jobId || "");
        
        if (status.success && status.data?.status === "completed") {
          clearInterval(pollInterval);
          
          // Get crawl results
          const results = await firecrawlService.getCrawlResults(crawlResult.data?.jobId || "");
          
          if (results.success && results.data?.content) {
            // Update job with content
            await supabaseClient.rpc("update_document_processing_status", {
              p_job_id: job,
              p_status: "completed",
              p_content: results.data.content,
              p_metadata: {
                pages: results.data.pages,
                url: results.data.url,
              },
            });
          } else {
            // Update job with error
            await supabaseClient.rpc("update_document_processing_status", {
              p_job_id: job,
              p_status: "failed",
              p_error: results.error || "Failed to get crawl results",
            });
          }
        } else if (status.success && status.data?.status === "failed") {
          clearInterval(pollInterval);
          
          // Update job with error
          await supabaseClient.rpc("update_document_processing_status", {
            p_job_id: job,
            p_status: "failed",
            p_error: status.error || "Crawl failed",
          });
        }
      }, 5000); // Poll every 5 seconds
    } else {
      // Use LlamaParse for document processing
      const parseResult = await llamaParseService.processDocument({
        file: new File([documentUrl], "document", { type: documentType }),
        metadata: {
          clientId,
          agentName,
        },
      });

      if (parseResult.status === "success") {
        // Update job with content
        await supabaseClient.rpc("update_document_processing_status", {
          p_job_id: job,
          p_status: "completed",
          p_content: parseResult.content,
          p_metadata: parseResult.metadata,
        });
      } else {
        // Update job with error
        await supabaseClient.rpc("update_document_processing_status", {
          p_job_id: job,
          p_status: "failed",
          p_error: parseResult.error || "Failed to process document",
        });
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        jobId: job,
        message: "Document processing started",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in process-document function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 