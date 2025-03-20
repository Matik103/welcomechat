
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract the request data
    const { documentUrl, documentType, clientId, agentName, documentId, useLlamaParse } = await req.json();
    
    // Validate required fields
    if (!documentUrl || !documentType || !clientId || !agentName || !documentId) {
      console.error("Missing required fields:", { documentUrl, documentType, clientId, agentName, documentId });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create a Supabase client for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    // Create a processing job record
    const { data: jobData, error: jobError } = await supabase
      .from("document_processing_jobs")
      .insert({
        client_id: clientId,
        agent_name: agentName,
        document_id: documentId,
        document_type: documentType,
        document_url: documentUrl,
        status: "processing",
        metadata: {
          started_at: new Date().toISOString(),
          source_type: documentType,
          processing_method: useLlamaParse ? "llamaparse" : "firecrawl"
        }
      })
      .select()
      .single();

    if (jobError) {
      console.error("Error creating processing job:", jobError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to create processing job" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Created processing job:", jobData.id);

    // Determine which service to use based on document type
    // Website URLs always use Firecrawl, everything else uses LlamaParse
    if (documentType === "website_url" || documentType.includes("website") || documentUrl.includes("/folders/")) {
      // Use Firecrawl for website URLs and Google Drive folders
      return await processWithFirecrawl(
        supabase, 
        jobData.id, 
        documentUrl, 
        documentType, 
        clientId, 
        agentName,
        documentId,
        corsHeaders
      );
    } else {
      // Use LlamaParse for all document processing
      return await processWithLlamaParse(
        supabase, 
        jobData.id, 
        documentUrl, 
        documentType, 
        clientId, 
        agentName,
        documentId,
        corsHeaders
      );
    }

  } catch (error) {
    console.error('Error in process-document function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Unhandled error: ${error.message}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Process with LlamaParse
async function processWithLlamaParse(
  supabase: any, 
  jobId: string, 
  documentUrl: string, 
  documentType: string, 
  clientId: string, 
  agentName: string,
  documentId: string,
  corsHeaders: any
) {
  const llamaCloudApiKey = Deno.env.get("LLAMA_CLOUD_API_KEY");

  if (!llamaCloudApiKey) {
    await updateJobStatus(supabase, jobId, "failed", "LlamaCloud API key is missing");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "LlamaCloud API key is missing" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }

  console.log(`Processing ${documentType} with LlamaParse:`, documentUrl);

  try {
    // Call the LlamaParse API
    const llamaParseUrl = "https://api.cloud.llamaindex.ai/api/parsing";
    const response = await fetch(llamaParseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${llamaCloudApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: documentUrl,
        result_type: "markdown" // Request markdown format
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LlamaParse API error:", errorText);
      await updateJobStatus(supabase, jobId, "failed", `LlamaParse API error: ${response.status} ${response.statusText} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `LlamaParse API error: ${response.status} ${response.statusText}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }

    const llamaParseResult = await response.json();
    console.log("LlamaParse API response received");

    // Extract content from the LlamaParse result
    let extractedContent = "";
    if (llamaParseResult.text) {
      extractedContent = llamaParseResult.text;
    } else if (llamaParseResult.markdown) {
      extractedContent = llamaParseResult.markdown;
    } else {
      extractedContent = JSON.stringify(llamaParseResult);
    }

    if (!extractedContent) {
      await updateJobStatus(supabase, jobId, "failed", "No content could be extracted from LlamaParse");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No content could be extracted from LlamaParse" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Update job status and store content
    await updateJobStatus(supabase, jobId, "completed", null, extractedContent);

    // Add the extracted content to the AI agent's knowledge base
    const { data: agentData, error: agentError } = await supabase
      .from("ai_agents")
      .insert({
        client_id: clientId,
        name: agentName,
        content: extractedContent,
        url: documentUrl,
        interaction_type: "document_content",
        settings: {
          document_id: documentId,
          document_type: documentType,
          document_url: documentUrl,
          processed_at: new Date().toISOString(),
          content_length: extractedContent.length,
          processing_method: "llamaparse",
          llamaparse_job_id: jobId
        }
      });

    if (agentError) {
      console.error("Error saving to AI agent knowledge base:", agentError);
      await updateJobStatus(supabase, jobId, "failed", `Error saving to AI agent knowledge base: ${agentError.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error saving to AI agent knowledge base: ${agentError.message}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log success activity
    await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: "document_processed",
        description: `Successfully processed ${documentType} with LlamaParse: ${documentUrl}`,
        metadata: {
          document_id: documentId,
          document_type: documentType,
          document_url: documentUrl,
          content_length: extractedContent.length,
          processing_job_id: jobId,
          processing_method: "llamaparse"
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Document processed successfully with LlamaParse",
        job_id: jobId,
        content_length: extractedContent.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing with LlamaParse:", error);
    await updateJobStatus(supabase, jobId, "failed", `LlamaParse processing error: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `LlamaParse processing error: ${error.message}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}

// Process with Firecrawl (existing functionality)
async function processWithFirecrawl(
  supabase: any, 
  jobId: string, 
  documentUrl: string, 
  documentType: string, 
  clientId: string, 
  agentName: string,
  documentId: string,
  corsHeaders: any
) {
  // Configure Firecrawl request based on document type
  let firecrawlEndpoint = "";
  let requestData = {};
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!firecrawlApiKey) {
    await updateJobStatus(supabase, jobId, "failed", "Firecrawl API key is missing");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Firecrawl API key is missing" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }

  // Handle different document types
  if (documentType === "website_url" || documentUrl.startsWith("http") && !documentUrl.includes("drive.google.com")) {
    firecrawlEndpoint = "https://api.firecrawl.dev/crawl/url";
    requestData = {
      url: documentUrl,
      options: {
        limit: 100,
        formats: ["markdown"]
      }
    };
  } else if (documentType === "google_drive_folder") {
    // Special handling for Google Drive folders
    firecrawlEndpoint = "https://api.firecrawl.dev/content/drive-folder";
    requestData = {
      folderId: extractGoogleDriveFolderId(documentUrl),
      options: {
        recursive: true,
        formats: ["markdown"]
      }
    };
  } else {
    await updateJobStatus(supabase, jobId, "failed", `Unsupported document type for Firecrawl: ${documentType}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Unsupported document type for Firecrawl: ${documentType}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  console.log(`Processing ${documentType} with Firecrawl:`, documentUrl);
  console.log("Request data:", JSON.stringify(requestData));

  try {
    // Call the Firecrawl API
    const response = await fetch(firecrawlEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData)
    });

    const firecrawlResult = await response.json();

    if (!response.ok) {
      console.error("Firecrawl API error:", firecrawlResult);
      await updateJobStatus(supabase, jobId, "failed", `Firecrawl API error: ${firecrawlResult.error || response.statusText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Firecrawl API error: ${firecrawlResult.error || response.statusText}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }

    console.log("Firecrawl API response received");

    // Extract content from the Firecrawl result
    let extractedContent = "";
    if (documentType === "website_url" || documentUrl.startsWith("http") && !documentUrl.includes("drive.google.com")) {
      // For websites, concatenate all page content
      if (firecrawlResult.pages && firecrawlResult.pages.length > 0) {
        extractedContent = firecrawlResult.pages
          .map((page: any) => {
            const pageTitle = page.title ? `# ${page.title}\n\n` : "";
            const pageContent = page.formats && page.formats.markdown ? page.formats.markdown : "";
            return `${pageTitle}${pageContent}\n\n`;
          })
          .join("\n");
      }
    } else if (documentType === "google_drive_folder") {
      // For Google Drive folders, concatenate all file contents
      if (firecrawlResult.files && firecrawlResult.files.length > 0) {
        extractedContent = firecrawlResult.files
          .map((file: any) => {
            const fileTitle = file.name ? `# ${file.name}\n\n` : "";
            const fileContent = file.content && file.content.formats && file.content.formats.markdown 
              ? file.content.formats.markdown 
              : "";
            return `${fileTitle}${fileContent}\n\n`;
          })
          .join("\n");
          
        // Log the number of files processed
        await updateJobMetadata(supabase, jobId, {
          files_processed: firecrawlResult.files.length,
          folder_id: extractGoogleDriveFolderId(documentUrl)
        });
      }
    }

    if (!extractedContent) {
      await updateJobStatus(supabase, jobId, "failed", "No content could be extracted from Firecrawl");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No content could be extracted from Firecrawl" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Update the processing job with the extracted content
    await updateJobStatus(supabase, jobId, "completed", null, extractedContent);

    // Add the extracted content to the AI agent's knowledge base
    const { data: agentData, error: agentError } = await supabase
      .from("ai_agents")
      .insert({
        client_id: clientId,
        name: agentName,
        content: extractedContent,
        url: documentUrl,
        interaction_type: "document_content",
        settings: {
          document_id: documentId,
          document_type: documentType,
          document_url: documentUrl,
          processed_at: new Date().toISOString(),
          content_length: extractedContent.length,
          processing_method: "firecrawl",
          firecrawl_job_id: jobId
        }
      });

    if (agentError) {
      console.error("Error saving to AI agent knowledge base:", agentError);
      await updateJobStatus(supabase, jobId, "failed", `Error saving to AI agent knowledge base: ${agentError.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error saving to AI agent knowledge base: ${agentError.message}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log the successful processing
    await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: "document_processed",
        description: `Successfully processed ${documentType} with Firecrawl: ${documentUrl}`,
        metadata: {
          document_id: documentId,
          document_type: documentType,
          document_url: documentUrl,
          content_length: extractedContent.length,
          processing_job_id: jobId,
          processing_method: "firecrawl"
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Document processed successfully with Firecrawl",
        job_id: jobId,
        content_length: extractedContent.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing with Firecrawl:", error);
    await updateJobStatus(supabase, jobId, "failed", `Firecrawl processing error: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Firecrawl processing error: ${error.message}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}

// Helper function to extract Google Drive folder ID
function extractGoogleDriveFolderId(url: string): string {
  if (url.includes('drive.google.com/drive/folders/')) {
    const folderMatch = url.match(/folders\/([^/?]+)/);
    if (folderMatch && folderMatch[1]) {
      return folderMatch[1];
    }
  }
  
  if (url.includes('id=')) {
    const urlObj = new URL(url);
    const id = urlObj.searchParams.get('id');
    if (id) return id;
  }
  
  throw new Error("Could not extract folder ID from URL");
}

// Helper function to update job status
async function updateJobStatus(supabase: any, jobId: string, status: string, errorMessage?: string | null, content?: string) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
    metadata: {
      last_updated: new Date().toISOString()
    }
  };

  if (errorMessage) {
    updateData.error_message = errorMessage;
    updateData.metadata.error_message = errorMessage;
  }

  if (content) {
    updateData.content = content;
    updateData.metadata.content_length = content.length;
  }

  const { error } = await supabase
    .from("document_processing_jobs")
    .update(updateData)
    .eq("id", jobId);

  if (error) {
    console.error("Error updating job status:", error);
  }
}

// Helper function to update job metadata
async function updateJobMetadata(supabase: any, jobId: string, metadata: Record<string, any>) {
  const { data, error } = await supabase
    .from("document_processing_jobs")
    .select("metadata")
    .eq("id", jobId)
    .single();
    
  if (error) {
    console.error("Error fetching job metadata:", error);
    return;
  }
  
  const updatedMetadata = { ...data.metadata, ...metadata };
  
  const { error: updateError } = await supabase
    .from("document_processing_jobs")
    .update({ metadata: updatedMetadata })
    .eq("id", jobId);
    
  if (updateError) {
    console.error("Error updating job metadata:", updateError);
  }
}
