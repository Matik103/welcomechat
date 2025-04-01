
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: jobId",
          success: false
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Checking status for processing job: ${jobId}`);

    // Query the document_processing_jobs table
    const { data: job, error } = await supabaseClient
      .from('document_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error("Error fetching job:", error);
      return new Response(
        JSON.stringify({
          error: error.message,
          success: false
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!job) {
      return new Response(
        JSON.stringify({
          error: "Job not found",
          success: false
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // If the job is in processing state and has firecrawl_job_id in metadata,
    // check the status with Firecrawl
    if (job.status === 'processing' && 
        job.metadata && 
        job.metadata.firecrawl_job_id) {
      
      try {
        const firecrawlJobId = job.metadata.firecrawl_job_id;
        console.log(`Checking Firecrawl job status: ${firecrawlJobId}`);
        
        // Import here to avoid initialization issues
        const { FirecrawlService } = await import('../_shared/FirecrawlService.ts');
        
        const firecrawlService = new FirecrawlService({
          apiKey: Deno.env.get("FIRECRAWL_API_KEY") || "",
        });
        
        const status = await firecrawlService.getCrawlStatus(firecrawlJobId);
        
        if (status.success && status.data?.status === "completed") {
          const results = await firecrawlService.getCrawlResults(firecrawlJobId);
          
          if (results.success && results.data?.content) {
            // Update job with content
            await supabaseClient.rpc("update_document_processing_status", {
              p_job_id: jobId,
              p_status: "completed",
              p_content: results.data.content,
              p_metadata: {
                ...job.metadata,
                pages: results.data.pages,
                url: results.data.url,
              },
            });
            
            // Return updated job status
            return new Response(
              JSON.stringify({
                success: true,
                status: "completed",
                message: "Document processing completed",
                pages: results.data.pages,
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
              }
            );
          }
        }
        
        // If still processing, return current status
        return new Response(
          JSON.stringify({
            success: true,
            status: job.status,
            firecrawlStatus: status.data?.status || "unknown",
            message: "Document still processing",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } catch (firecrawlError) {
        console.error("Error checking Firecrawl status:", firecrawlError);
      }
    }

    // Return job details
    return new Response(
      JSON.stringify({
        success: true,
        status: job.status,
        message: `Document processing ${job.status}`,
        job: {
          id: job.id,
          status: job.status,
          document_url: job.document_url,
          document_type: job.document_type,
          created_at: job.created_at,
          updated_at: job.updated_at,
          error_message: job.error_message,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in check-document-status function:", error);
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
