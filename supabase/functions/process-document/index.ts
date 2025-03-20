import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    return 'firecrawl';
  }
  
  // For Google Drive URLs and uploaded files, use LlamaParse
  if (documentType === 'google_drive_url' || documentType === 'file_upload') {
    return 'llamaparse';
  }

  throw new Error(`Unsupported document type: ${documentType}`);
}

// Helper function to store content in ai_agents table
async function storeInAiAgents(
  supabase: SupabaseClient,
  clientId: string,
  agentName: string,
  content: string,
  documentType: string,
  documentUrl: string,
  metadata: any = {}
) {
  const { error } = await supabase
    .from("ai_agents")
    .insert({
      client_id: clientId,
      name: agentName,
      content: content,
      url: documentUrl,
      interaction_type: `${documentType}_content`,
      settings: metadata,
      is_error: false,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error storing content in ai_agents:', error);
    throw new Error(`Failed to store content in ai_agents: ${error.message}`);
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

    // Step 1: Upload document
    const uploadResponse = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LLAMAPARSE_API_KEY')}`
      },
      body: JSON.stringify({
        file_url: documentUrl,
        file_type: documentType
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

    // Step 2: Poll for job completion
    let jobStatus;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${llamaParseJobId}`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('LLAMAPARSE_API_KEY')}`
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.statusText}`);
      }

      jobStatus = await statusResponse.json();

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
    const resultResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/result/${llamaParseJobId}`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LLAMAPARSE_API_KEY')}`
      }
    });

    if (!resultResponse.ok) {
      throw new Error(`Failed to get job result: ${resultResponse.statusText}`);
    }

    const result = await resultResponse.json();
    const extractedContent = result.content;

    if (!extractedContent) {
      await updateJobStatus(supabase, jobId, "failed", "No content could be extracted from LlamaParse");
      return {
        success: false,
        error: "No content could be extracted from LlamaParse"
      };
    }

    // Update AI agent content
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({
        content: extractedContent,
        processed_at: new Date().toISOString(),
        processing_method: "llamaparse",
        llamaparse_job_id: llamaParseJobId,
        document_metadata: result.metadata || {}
      })
      .eq('id', documentId);

    if (updateError) {
      console.error("Error updating AI agent content:", updateError);
      await updateJobStatus(supabase, jobId, "failed", `Failed to update AI agent content: ${updateError.message}`);
      return {
        success: false,
        error: `Failed to update AI agent content: ${updateError.message}`
      };
    }

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
        llamaparse_job_id: llamaParseJobId
      }
    );

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

    // Step 1: Start crawling job
    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify({
        url: documentUrl,
        maxDepth: 2,
        limit: 10,
        scrapeOptions: {
          recursive: true,
          formats: ["markdown"]
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
    const crawlJobId = crawlResult.job_id;

    // Step 2: Poll for job completion
    let jobStatus;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlJobId}`, {
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.statusText}`);
      }

      jobStatus = await statusResponse.json();

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

    // Step 3: Get the crawled content
    const resultResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlJobId}/content`, {
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`
      }
    });

    if (!resultResponse.ok) {
      throw new Error(`Failed to get job result: ${resultResponse.statusText}`);
    }

    const result = await resultResponse.json();
    const extractedContent = result.content;

    // Update AI agent content
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({
        content: extractedContent,
        processed_at: new Date().toISOString(),
        processing_method: "firecrawl",
        document_metadata: result.metadata || {}
      })
      .eq('id', documentId);

    if (updateError) {
      console.error("Error updating AI agent content:", updateError);
      await updateJobStatus(supabase, jobId, "failed", `Failed to update AI agent content: ${updateError.message}`);
      return {
        success: false,
        error: `Failed to update AI agent content: ${updateError.message}`
      };
    }

    // Log success
    await createClientActivity(
      supabase,
      clientId,
      "document_processing_completed",
      `Successfully processed ${documentType} with Firecrawl: ${documentUrl}`,
      {
        document_url: documentUrl,
        processing_method: "firecrawl",
        firecrawl_job_id: crawlJobId
      }
    );

    await updateJobStatus(supabase, jobId, "completed", "Document processed successfully with Firecrawl");

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
        processing_method: 'firecrawl',
        job_id: jobId,
        firecrawl_job_id: crawlJobId
      }
    );

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