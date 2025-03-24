import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { config, validators } from "./config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper function to update job status
async function updateJobStatus(
  supabase: SupabaseClient,
  jobId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  error?: string
) {
  const { error: updateError } = await supabase
    .from('document_processing_jobs')
    .update({
      status,
      error,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  if (updateError) {
    console.error('Error updating job status:', updateError);
  }
}

// Helper function to create client activity
async function createClientActivity(
  supabase: SupabaseClient,
  clientId: string,
  activityType: string,
  description: string,
  metadata: any = {}
) {
  const { error } = await supabase
    .from('client_activities')
      .insert({
        client_id: clientId,
        activity_type: activityType,
        description,
        metadata,
        created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error creating client activity:', error);
  }
}

// Helper function to extract Google Drive folder ID from URL
function extractGoogleDriveFolderId(url: string): string {
  const match = url.match(/folders\/([^?\/]+)/);
  if (!match) {
    throw new Error('Invalid Google Drive folder URL');
  }
  return match[1];
}

// Helper function to determine processing method based on document type and URL
export function determineProcessingMethod(documentType: string, documentUrl: string): 'llamaparse' | 'firecrawl' {
  // If it's explicitly a website URL and not a document URL, use Firecrawl
  if (documentType === 'website_url' && !documentUrl.endsWith('.pdf') && !documentUrl.endsWith('.doc') && 
      !documentUrl.endsWith('.docx') && !documentUrl.endsWith('.ppt') && !documentUrl.endsWith('.pptx') && 
      !documentUrl.endsWith('.xls') && !documentUrl.endsWith('.xlsx')) {
    if (!documentUrl.includes('drive.google.com') && 
        !documentUrl.includes('docs.google.com') && 
        !documentUrl.includes('sheets.google.com')) {
      return 'firecrawl';
    }
  }
  
  // For all other cases (documents, Google Drive URLs, etc.), use LlamaParse
  return 'llamaparse';
}

// Helper function to store content in ai_agents table and integrate with OpenAI
async function storeInAiAgents(
  supabase: SupabaseClient,
  clientId: string,
  agentName: string,
  content: string,
  documentType: string,
  documentUrl: string,
  metadata: Record<string, any>
) {
  try {
    console.log("Attempting to store content in ai_agents with metadata:", metadata);
    
    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        client_id: clientId,
        name: agentName,
        content: content,
        url: documentUrl,
        interaction_type: "document",
        settings: {
          title: metadata.title || "Untitled Document",
          document_type: documentType,
          source_url: documentUrl,
          processing_method: metadata.processing_method,
          processed_at: new Date().toISOString(),
          ...metadata
        },
        status: "active",
        type: documentType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing content in ai_agents:", error);
      throw new Error(`Failed to store content in ai_agents: ${error.message}`);
    }

    console.log("Successfully stored content in ai_agents:", data);
    
    // Now try to upload the document to OpenAI Assistant
    try {
      console.log("Attempting to upload document to OpenAI Assistant");
      
      // Call the upload-document-to-assistant Edge Function
      await supabase.functions.invoke('upload-document-to-assistant', {
        method: 'POST',
        body: {
          clientId: clientId,
          agentName: agentName,
          documentContent: content,
          documentTitle: metadata.title || "Untitled Document"
        }
      });
      
      console.log("Document successfully uploaded to OpenAI Assistant");
    } catch (openaiError) {
      console.error("Error uploading to OpenAI Assistant (continuing anyway):", openaiError);
      
      // Log this error but don't fail the entire operation
      await createClientActivity(
        supabase,
        clientId,
        "openai_assistant_upload_failed",
        `Failed to upload document to OpenAI Assistant: ${openaiError.message || "Unknown error"}`,
        {
          document_url: documentUrl,
          title: metadata.title || "Untitled Document",
          error: openaiError.message
        }
      );
    }
    
    return data;
  } catch (error) {
    console.error("Error in storeInAiAgents:", error);
    throw error;
  }
}

// Process with LlamaParse
export async function processWithLlamaParse(
  documentUrl: string, 
  documentType: string, 
  clientId: string, 
  agentName: string,
  documentId: string,
  supabase: SupabaseClient,
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Processing ${documentType} with LlamaParse:`, documentUrl);
    
    const LLAMA_CLOUD_API_KEY = Deno.env.get("LLAMA_CLOUD_API_KEY");
    if (!LLAMA_CLOUD_API_KEY) {
      throw new Error("LLAMA_CLOUD_API_KEY environment variable is not set");
    }

    // Update job status to processing
    await updateJobStatus(supabase, jobId, "processing", "Starting LlamaParse processing");
    
    // Determine file type for LlamaParse API
    let fileType = "pdf";
    if (documentType.includes("google_doc")) {
      fileType = "gdoc";
    } else if (documentType.includes("google_sheet")) {
      fileType = "gsheet";
    } else if (documentType.includes("powerpoint") || documentType.endsWith(".ppt") || documentType.endsWith(".pptx")) {
      fileType = "pptx";
    } else if (documentType.includes("excel") || documentType.endsWith(".xls") || documentType.endsWith(".xlsx")) {
      fileType = "xlsx";
    } else if (documentType.includes("word") || documentType.endsWith(".doc") || documentType.endsWith(".docx")) {
      fileType = "docx";
    }

    // Step 1: Download the file
    console.log(`Downloading file from: ${documentUrl}`);
    const fileResponse = await fetch(documentUrl);
    console.log("File download response status:", fileResponse.status);
    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.error("File download error:", errorText);
      throw new Error(`Failed to download file: ${fileResponse.statusText}. Details: ${errorText}`);
    }
    const fileBlob = await fileResponse.blob();
    console.log("File downloaded successfully, size:", fileBlob.size);

    // Step 2: Create form data with correct content type
    const formData = new FormData();
    const contentType = fileType === 'pdf' ? 'application/pdf' :
                       fileType === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                       fileType === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                       fileType === 'pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' :
                       'application/octet-stream';
    formData.append('file', new Blob([fileBlob], { type: contentType }), `document.${fileType}`);
    console.log("Form data created with content type:", contentType);

    // Step 3: Upload document to LlamaParse
    console.log(`Uploading document to LlamaParse with type: ${fileType}`);
    const uploadResponse = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`
      },
      body: formData
    });
    console.log("Upload response status:", uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("LlamaParse upload error:", errorText);
      const errorDetails = `LlamaParse upload error: ${uploadResponse.status} ${uploadResponse.statusText}. Details: ${errorText}`;
      await updateJobStatus(supabase, jobId, "failed", errorDetails);
      return {
        success: false, 
        error: errorDetails
      };
    }

    const uploadResult = await uploadResponse.json();
    console.log("Upload response:", uploadResult);
    const llamaParseJobId = uploadResult.id;
    if (!llamaParseJobId) {
      throw new Error("No job ID returned from LlamaParse upload");
    }
    console.log("LlamaParse job created:", llamaParseJobId);

    // Step 4: Poll for job completion
    let jobStatus;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${llamaParseJobId}`, {
        headers: {
          'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`
        }
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("LlamaParse status check error:", errorText);
        throw new Error(`Failed to check job status: ${statusResponse.statusText}. Details: ${errorText}`);
      }

      jobStatus = await statusResponse.json();
      console.log("LlamaParse job status:", jobStatus.status);

      if (jobStatus.status === 'completed') {
        break;
      } else if (jobStatus.status === 'failed') {
        throw new Error(`Job failed: ${jobStatus.error || 'Unknown error'}`);
      }

      // Wait 10 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Job timed out after 5 minutes');
    }

    // Step 5: Get the parsed content
    console.log("Retrieving parsed content");
    const resultResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/result/${llamaParseJobId}`, {
      headers: {
        'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`
      }
    });

    if (!resultResponse.ok) {
      throw new Error(`Failed to get job result: ${resultResponse.statusText}`);
    }

    const result = await resultResponse.json();
    const extractedContent = result.content;
    console.log("Content extracted successfully, length:", extractedContent.length);

    if (!extractedContent) {
      await updateJobStatus(supabase, jobId, "failed", "No content could be extracted from LlamaParse");
      return {
        success: false, 
        error: "No content could be extracted from LlamaParse" 
      };
    }

    // After successful processing, store in ai_agents table
    await storeInAiAgents(
      supabase,
      clientId,
      agentName,
      extractedContent,
      documentType,
      documentUrl,
      {
        document_id: documentId,
        processing_method: 'llamaparse',
        job_id: jobId,
        llamaparse_job_id: llamaParseJobId,
        metadata: result.metadata || {},
        title: result.metadata?.title || documentUrl.split('/').pop() || "Untitled Document"
      }
    );

    // Log success
    await createClientActivity(
      supabase,
      clientId,
      "document_processing_completed",
      `Successfully processed ${documentType} with LlamaParse: ${documentUrl}`,
      {
        document_url: documentUrl,
        processing_method: "llamaparse",
        llamaparse_job_id: llamaParseJobId
      }
    );

    await updateJobStatus(supabase, jobId, "completed", "Document processed successfully with LlamaParse");

    return { success: true };
  } catch (error) {
    console.error("Error processing with LlamaParse:", error);
    await updateJobStatus(supabase, jobId, "failed", `LlamaParse processing error: ${error.message}`);
    return {
      success: false, 
      error: `LlamaParse processing error: ${error.message}` 
    };
  }
}

// Process with Firecrawl
export async function processWithFirecrawl(
  supabase: SupabaseClient,
  jobId: string,
  documentUrl: string,
  documentType: string,
  clientId: string,
  agentName: string,
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

    if (!firecrawlApiKey) {
      await updateJobStatus(supabase, jobId, "failed", "Firecrawl API key is missing");
      return {
        success: false,
        error: "Firecrawl API key is missing"
      };
    }

    if (documentType !== "website_url") {
      await updateJobStatus(supabase, jobId, "failed", `Unsupported document type for Firecrawl: ${documentType}`);
      return {
        success: false,
        error: `Unsupported document type for Firecrawl: ${documentType}`
      };
    }

    // Step 1: Start crawling job with V1 API schema
    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify({
        url: documentUrl,
        maxDepth: 3,
        limit: 50,
        allowBackwardLinks: true,
        allowExternalLinks: false,
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
          includeTags: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "article", "main", "section"],
          excludeTags: ["nav", "footer", "header", "aside", "script", "style", "button", ".cookie-banner", ".popup", ".modal", ".advertisement", ".social-share", ".newsletter-signup"],
          waitFor: 1000,
          timeout: 30000
        }
      })
    });

    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text();
      console.error("Firecrawl API error:", errorText);
      await updateJobStatus(supabase, jobId, "failed", `Firecrawl API error: ${crawlResponse.status} ${crawlResponse.statusText}`);
      return {
        success: false,
        error: `Firecrawl API error: ${crawlResponse.status} ${crawlResponse.statusText}`
      };
    }

    const crawlResult = await crawlResponse.json();
    
    if (!crawlResult.success || !crawlResult.id) {
      throw new Error('Failed to start crawl job');
    }

    const crawlJobId = crawlResult.id;
    console.log('Crawl Job ID:', crawlJobId);

    // Step 2: Poll for job completion with improved error handling
    let jobStatus;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlJobId}`, {
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.statusText}`);
      }

      jobStatus = await statusResponse.json();
      console.log('Job status:', jobStatus.status);

      if (jobStatus.status === 'completed') {
        break;
      } else if (jobStatus.status === 'failed') {
        throw new Error(`Job failed: ${jobStatus.error || 'Unknown error'}`);
      }

      // Update job status in database
      await updateJobStatus(supabase, jobId, "processing", `Crawling in progress: ${jobStatus.status}`);

      // Wait 10 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Job timed out after 5 minutes');
    }

    // Step 3: Get the crawled content
    const resultResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlJobId}`, {
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!resultResponse.ok) {
      throw new Error(`Failed to get job result: ${resultResponse.statusText}`);
    }

    const result = await resultResponse.json();
    
    // Check if we need to paginate through results
    let allData: any[] = result.data || [];
    let nextUrl = result.next;
    
    while (nextUrl) {
      const nextResponse = await fetch(nextUrl, {
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!nextResponse.ok) {
        throw new Error(`Failed to get next page of results: ${nextResponse.statusText}`);
      }

      const nextResult = await nextResponse.json();
      allData = allData.concat(nextResult.data || []);
      nextUrl = nextResult.next;
    }

    // Combine all markdown content
    const extractedContent = allData
      .map(item => item.markdown)
      .filter(Boolean)
      .join('\n\n---\n\n');

    if (!extractedContent) {
      throw new Error('No content was extracted from the crawl');
    }

    // Store the content in ai_agents table
    await storeInAiAgents(
      supabase,
      clientId,
      agentName,
      extractedContent,
      documentType,
      documentUrl,
      {
        document_id: documentId,
        processing_method: 'firecrawl',
        job_id: jobId,
        firecrawl_job_id: crawlJobId,
        crawl_depth: 3,
        crawl_limit: 50,
        crawl_status: 'completed',
        pages_crawled: allData.length,
        title: documentUrl
      }
    );

    // Log success
    await createClientActivity(
      supabase,
      clientId,
      "document_processing_completed",
      `Successfully processed website with Firecrawl: ${documentUrl}`,
      {
        document_url: documentUrl,
        processing_method: "firecrawl",
        firecrawl_job_id: crawlJobId,
        pages_crawled: allData.length
      }
    );

    await updateJobStatus(supabase, jobId, "completed", "Website processed successfully with Firecrawl");

    return { success: true };
  } catch (error) {
    console.error("Error processing with Firecrawl:", error);
    await updateJobStatus(supabase, jobId, "failed", `Firecrawl processing error: ${error.message}`);
    return {
      success: false,
      error: `Firecrawl processing error: ${error.message}`
    };
  }
}

serve(async (req: Request) => {
  const startTime = Date.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    // Parse and validate request data
    const requestData = await req.json();
    const { documentUrl, documentType, clientId, agentName, documentId, test } = requestData;

    if (!documentType || !clientId || !agentName || !documentId) {
      throw new Error(config.errors.missingParams);
    }

    // For test requests, return a success response
    if (test) {
      console.log('Test request detected, returning mock response');
      return new Response(
        JSON.stringify({
          success: true,
          content: 'Test document content',
          metadata: {
            processing_method: 'test',
            document_type: documentType,
            document_url: documentUrl,
            processing_time_ms: Date.now() - startTime
          }
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate document URL and type
    if (!documentUrl || !validators.isValidUrl(documentUrl)) {
      throw new Error('Invalid document URL');
    }

    if (!validators.isValidDocumentType(documentType)) {
      throw new Error(config.errors.invalidFileType);
    }

    // Create a processing job record
    const { data: job, error: jobError } = await supabase
      .from('document_processing_jobs')
      .insert({
        document_url: documentUrl,
        document_type: documentType,
        client_id: clientId,
        agent_name: agentName,
        document_id: documentId,
        processing_method: determineProcessingMethod(documentType, documentUrl),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (jobError) {
      throw new Error(`Failed to create processing job: ${jobError.message}`);
    }

    // Start processing in the background
    (async () => {
      try {
        const processingMethod = determineProcessingMethod(documentType, documentUrl);
        let result;

        if (processingMethod === "llamaparse") {
          result = await processWithLlamaParse(
            documentUrl,
            documentType,
            clientId,
            agentName,
            documentId,
            supabase,
            job.id
          );
        } else if (processingMethod === "firecrawl") {
          result = await processWithFirecrawl(
            supabase,
            job.id,
            documentUrl,
            documentType,
            clientId,
            agentName,
            documentId
          );
        } else {
          throw new Error(`Unsupported processing method: ${processingMethod}`);
        }

        console.log('Processing completed:', result);
      } catch (error) {
        console.error('Processing error:', error);
        await updateJobStatus(supabase, job.id, "failed", error.message);
        
        // Log error to client activities
        await createClientActivity(
          supabase,
          clientId,
          "document_processing_failed",
          `Failed to process document: ${error.message}`,
          {
            document_url: documentUrl,
            document_type: documentType,
            error: error.message
          }
        );
      }
    })();

    // Return immediately with the job ID
    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        status: 'pending',
        message: 'Document processing started',
        metadata: {
          document_type: documentType,
          document_url: documentUrl,
          processing_method: determineProcessingMethod(documentType, documentUrl),
          request_time_ms: Date.now() - startTime
        }
      }),
      { 
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        metadata: {
          request_time_ms: Date.now() - startTime
        }
      }),
      { 
        status: error.message === config.errors.invalidToken ? 401 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
