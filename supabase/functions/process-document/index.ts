
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
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
  // If it's a website URL, use Firecrawl
  if (documentType === 'website_url' || documentUrl.startsWith('http://') || documentUrl.startsWith('https://')) {
    if (!documentUrl.includes('drive.google.com') && 
        !documentUrl.includes('docs.google.com') && 
        !documentUrl.includes('sheets.google.com')) {
      return 'firecrawl';
    }
  }
  
  // For Google Drive URLs and uploaded files, use LlamaParse
  return 'llamaparse';
}

// Helper function to get public URL for a file path in storage
async function getPublicUrl(
  supabase: SupabaseClient,
  filePath: string
): Promise<string> {
  // First check if the document URL is already a public URL
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // If the path starts with a bucket name, extract it
  let bucketName = 'Document Storage'; // Default bucket name
  let path = filePath;
  
  if (filePath.includes('/')) {
    const parts = filePath.split('/');
    if (parts.length >= 2) {
      // Check if this might be a full path including the bucket
      const possibleBucket = parts[0];
      if (possibleBucket === 'Document Storage' || possibleBucket === 'Client Documents') {
        bucketName = possibleBucket;
        path = filePath.substring(bucketName.length + 1);
      }
    }
  }
  
  try {
    console.log(`Getting public URL for file: ${path} in bucket: ${bucketName}`);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, 60 * 60); // 1 hour expiry
    
    if (error) {
      console.error('Error creating signed URL:', error);
      throw error;
    }
    
    if (!data || !data.signedUrl) {
      // Try to get a public URL as fallback
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(path);
        
      if (publicUrlData && publicUrlData.publicUrl) {
        console.log(`Using public URL: ${publicUrlData.publicUrl}`);
        return publicUrlData.publicUrl;
      } else {
        throw new Error('Failed to get signed or public URL for file');
      }
    }
    
    console.log(`Got signed URL: ${data.signedUrl}`);
    return data.signedUrl;
  } catch (error) {
    console.error('Error in getPublicUrl:', error);
    throw error;
  }
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
    
    // Ensure we have a publicly accessible URL for LlamaParse
    let accessibleUrl = documentUrl;
    if (!documentUrl.startsWith('http://') && !documentUrl.startsWith('https://')) {
      try {
        accessibleUrl = await getPublicUrl(supabase, documentUrl);
        console.log(`Converted storage path to accessible URL: ${accessibleUrl}`);
      } catch (urlError) {
        console.error("Failed to get accessible URL:", urlError);
        await updateJobStatus(
          supabase, 
          jobId, 
          "failed", 
          `Failed to get accessible URL for document: ${urlError.message}`
        );
        return {
          success: false,
          error: `Failed to get accessible URL for document: ${urlError.message}`
        };
      }
    }
    
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

    // Step 1: Upload document to LlamaParse
    console.log(`Uploading document to LlamaParse with type: ${fileType} and URL: ${accessibleUrl}`);
    const uploadResponse = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`
      },
      body: JSON.stringify({
        file_url: accessibleUrl,
        file_type: fileType
      })
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("LlamaParse upload error:", errorText);
      await updateJobStatus(supabase, jobId, "failed", `LlamaParse upload error: ${uploadResponse.status} ${uploadResponse.statusText}`);
      return {
        success: false, 
        error: `LlamaParse upload error: ${uploadResponse.status} ${uploadResponse.statusText}`
      };
    }

    const uploadResult = await uploadResponse.json();
    const llamaParseJobId = uploadResult.job_id;
    console.log("LlamaParse job created:", llamaParseJobId);

    // Step 2: Poll for job completion
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
        throw new Error(`Failed to check job status: ${statusResponse.statusText}`);
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

    // Step 3: Get the parsed content
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { documentUrl, documentType, clientId, agentName, documentId } = await req.json();

    // Create a Supabase client for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    // Determine the appropriate processing method
    const processingMethod = determineProcessingMethod(documentType, documentUrl);

    // Create a processing job record
    const { data: job, error: jobError } = await supabase
      .from('document_processing_jobs')
      .insert({
        document_url: documentUrl,
        document_type: documentType,
        client_id: clientId,
        agent_name: agentName,
        document_id: documentId,
        processing_method: processingMethod,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (jobError) {
      throw new Error(`Failed to create processing job: ${jobError.message}`);
    }

    // Update job status to processing
    await updateJobStatus(supabase, job.id, "processing");

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

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
