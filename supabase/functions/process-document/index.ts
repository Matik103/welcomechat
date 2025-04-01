
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { LlamaParseService } from "../_shared/LlamaParseService.ts";
import { FirecrawlService } from "../_shared/FirecrawlService.ts";
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
    const { clientId, documentType, documentUrl, agentName, documentId } = await req.json();

    // Validate required fields
    if (!clientId || !documentType || !documentUrl || !agentName) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: clientId, documentType, documentUrl, and agentName are required",
          success: false
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Processing document: ${documentUrl} (type: ${documentType}) for client: ${clientId}`);

    // Create a processing job
    const { data: job, error: jobError } = await supabaseClient.rpc(
      "create_document_processing_job",
      {
        p_client_id: clientId,
        p_agent_name: agentName,
        p_document_url: documentUrl,
        p_document_type: documentType,
        p_document_id: documentId || crypto.randomUUID()
      }
    );

    if (jobError) {
      console.error("Error creating processing job:", jobError);
      
      // If the RPC function fails, try direct insert as fallback
      console.log("Attempting direct insert as fallback...");
      
      const { data: fallbackJob, error: fallbackError } = await supabaseClient
        .from('document_processing_jobs')
        .insert({
          client_id: clientId,
          agent_name: agentName,
          document_url: documentUrl,
          document_type: documentType,
          document_id: documentId || crypto.randomUUID(),
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (fallbackError) {
        console.error("Fallback insert also failed:", fallbackError);
        throw fallbackError;
      }
      
      if (fallbackJob) {
        console.log("Fallback job created successfully:", fallbackJob.id);
      }
    }

    // Get the job ID - either from the RPC function or from the fallback
    const jobId = job || documentId || crypto.randomUUID();
    console.log(`Created processing job: ${jobId}`);

    // Process the document based on type
    if (documentType === "url" || documentType === "web_page") {
      // Use Firecrawl for website crawling
      console.log("Using Firecrawl for URL processing");
      const crawlResult = await firecrawlService.crawlWebsite({
        url: documentUrl,
        maxDepth: 2,
        limit: 100,
        onlyMainContent: true,
      });

      if (!crawlResult.success) {
        // Update job status to failed
        await supabaseClient.rpc("update_document_processing_status", {
          p_job_id: jobId,
          p_status: "failed",
          p_error: crawlResult.error,
        });

        throw new Error(crawlResult.error || "Failed to crawl website");
      }

      // Get the job ID from the crawl result
      const firecrawlJobId = crawlResult.data?.jobId;
      
      if (!firecrawlJobId) {
        throw new Error("No job ID returned from Firecrawl");
      }

      // Check the status immediately
      const status = await firecrawlService.getCrawlStatus(firecrawlJobId);
      
      // If it's already completed, update the job
      if (status.success && status.data?.status === "completed") {
        const results = await firecrawlService.getCrawlResults(firecrawlJobId);
        
        if (results.success && results.data?.content) {
          // Update job with content
          await supabaseClient.rpc("update_document_processing_status", {
            p_job_id: jobId,
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
            p_job_id: jobId,
            p_status: "failed",
            p_error: results.error || "Failed to get crawl results",
          });
        }
      } else {
        // Start polling for results
        console.log(`Website crawl started with job ID: ${firecrawlJobId}. Will check status asynchronously.`);
        
        // Update job status to processing
        await supabaseClient.rpc("update_document_processing_status", {
          p_job_id: jobId,
          p_status: "processing",
          p_metadata: {
            firecrawl_job_id: firecrawlJobId,
            url: documentUrl,
          },
        });
      }
      
      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          jobId: jobId,
          message: "URL processing started",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (documentType === "google_drive") {
      // Use LlamaParse for Google Drive document processing
      console.log("Using LlamaParse for Google Drive document processing");
      
      try {
        const parseResult = await llamaParseService.processDocument({
          url: documentUrl,
          metadata: {
            clientId,
            agentName,
            source: "google_drive"
          }
        });

        if (parseResult.status === "success" && parseResult.content) {
          // Update job with content
          await supabaseClient.rpc("update_document_processing_status", {
            p_job_id: jobId,
            p_status: "completed",
            p_content: parseResult.content,
            p_metadata: parseResult.metadata,
          });

          console.log("Google Drive document processed successfully with LlamaParse");
          
          return new Response(
            JSON.stringify({
              success: true,
              jobId: jobId,
              message: "Google Drive document processed successfully",
              content: parseResult.content.substring(0, 100) + "...", // Just for logging
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        } else {
          // Update job with error
          await supabaseClient.rpc("update_document_processing_status", {
            p_job_id: jobId,
            p_status: "failed",
            p_error: parseResult.error || "Failed to process Google Drive document",
          });

          console.error("LlamaParse processing failed for Google Drive:", parseResult.error);
          
          return new Response(
            JSON.stringify({
              success: false,
              jobId: jobId,
              error: parseResult.error || "Failed to process Google Drive document",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500,
            }
          );
        }
      } catch (error) {
        console.error("Error processing Google Drive document:", error);
        
        // Update job with error
        await supabaseClient.rpc("update_document_processing_status", {
          p_job_id: jobId,
          p_status: "failed",
          p_error: error instanceof Error ? error.message : "Unknown error",
        });
        
        return new Response(
          JSON.stringify({
            success: false,
            jobId: jobId,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    } else {
      // Use LlamaParse for regular document processing
      console.log("Using LlamaParse for document processing");
      const parseResult = await llamaParseService.processDocument({
        file: documentUrl  // Pass the document URL
      });

      if (parseResult.status === "success" && parseResult.content) {
        // Update job with content
        await supabaseClient.rpc("update_document_processing_status", {
          p_job_id: jobId,
          p_status: "completed",
          p_content: parseResult.content,
          p_metadata: parseResult.metadata,
        });

        console.log("Document processed successfully with LlamaParse");
        
        return new Response(
          JSON.stringify({
            success: true,
            jobId: jobId,
            message: "Document processed successfully",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } else {
        // Update job with error
        await supabaseClient.rpc("update_document_processing_status", {
          p_job_id: jobId,
          p_status: "failed",
          p_error: parseResult.error || "Failed to process document",
        });

        console.error("LlamaParse processing failed:", parseResult.error);
        
        return new Response(
          JSON.stringify({
            success: false,
            jobId: jobId,
            error: parseResult.error || "Failed to process document",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    }
  } catch (error) {
    console.error("Error in process-document function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
