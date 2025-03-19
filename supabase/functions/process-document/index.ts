
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
    const { documentUrl, documentType, clientId, agentName, documentId } = await req.json();
    
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
          source_type: documentType
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

    // Configure Firecrawl request based on document type
    let firecrawlEndpoint = "";
    let requestData = {};
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

    if (!firecrawlApiKey) {
      await updateJobStatus(supabase, jobData.id, "failed", "Firecrawl API key is missing");
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
    } else if (documentType === "google_drive" || documentType === "google_doc" || 
              documentType === "excel" || documentType === "pdf") {
      firecrawlEndpoint = "https://api.firecrawl.dev/content/document";
      requestData = {
        url: documentUrl,
        options: {
          formats: ["markdown"]
        }
      };
    } else {
      await updateJobStatus(supabase, jobData.id, "failed", `Unsupported document type: ${documentType}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Unsupported document type: ${documentType}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Processing ${documentType} with Firecrawl:`, documentUrl);
    console.log("Request data:", JSON.stringify(requestData));

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
      await updateJobStatus(supabase, jobData.id, "failed", `Firecrawl API error: ${firecrawlResult.error || response.statusText}`);
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
        await updateJobMetadata(supabase, jobData.id, {
          files_processed: firecrawlResult.files.length,
          folder_id: extractGoogleDriveFolderId(documentUrl)
        });
      }
    } else {
      // For documents, use the content directly
      if (firecrawlResult.content && firecrawlResult.content.formats && firecrawlResult.content.formats.markdown) {
        extractedContent = firecrawlResult.content.formats.markdown;
      }
    }

    if (!extractedContent) {
      await updateJobStatus(supabase, jobData.id, "failed", "No content could be extracted");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No content could be extracted" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Update the processing job with the extracted content
    await updateJobStatus(supabase, jobData.id, "completed", null, extractedContent);

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
          firecrawl_job_id: jobData.id
        }
      });

    if (agentError) {
      console.error("Error saving to AI agent knowledge base:", agentError);
      await updateJobStatus(supabase, jobData.id, "failed", `Error saving to AI agent knowledge base: ${agentError.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error saving to AI agent knowledge base: ${agentError.message}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log the successful processing
    const { error: activityError } = await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: "document_processed",
        description: `Successfully processed ${documentType}: ${documentUrl}`,
        metadata: {
          document_id: documentId,
          document_type: documentType,
          document_url: documentUrl,
          content_length: extractedContent.length,
          processing_job_id: jobData.id
        }
      });

    if (activityError) {
      console.error("Error logging activity:", activityError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Document processed successfully",
        job_id: jobData.id,
        content_length: extractedContent.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unhandled error in process-document function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Unhandled error: ${error.message}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

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
