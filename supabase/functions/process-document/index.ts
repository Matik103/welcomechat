
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { config, isValidDocumentType, isValidUrl } from "./config.ts";

// Deno types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const LLAMA_API_KEY = Deno.env.get('LLAMA_API_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ProcessDocumentRequest {
  documentType: string;
  clientId: string;
  agentName: string;
  documentId: string;
  documentUrl: string;
}

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

async function recordJobStart(jobId: string, metadata: any) {
  try {
    await supabase.from('document_processing_jobs').insert({
      id: jobId,
      status: 'pending',
      metadata,
      error: 'Starting LlamaParse processing',
    });
  } catch (error) {
    console.error('Error recording job start:', error);
  }
}

async function processDocumentWithLlamaParse(request: ProcessDocumentRequest, jobId: string) {
  try {
    const llamaEndpoint = 'https://api.llamaindex.ai/v1/process_file';
    const response = await fetch(llamaEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLAMA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_url: request.documentUrl,
        output_type: 'markdown',
      }),
    });

    if (!response.ok) {
      throw new Error(`LlamaParse API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    await supabase.from('document_processing_jobs').update({
      status: 'completed',
      result: result,
      error: null,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    return result;
  } catch (error) {
    console.error('Error processing document:', error);
    await supabase.from('document_processing_jobs').update({
      status: 'failed',
      error: error.message,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);
    throw error;
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
    if (!documentUrl || !isValidUrl(documentUrl)) {
      throw new Error('Invalid document URL');
    }

    if (!isValidDocumentType(documentType)) {
      return new Response(JSON.stringify({
        success: false,
        error: config.errors.invalidDocType
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate unique job ID
    const jobId = crypto.randomUUID();

    // Record job metadata
    const metadata = {
      document_type: documentType,
      document_url: documentUrl,
      processing_method: 'llamaparse',
      request_time_ms: Date.now() - startTime
    };

    // Start processing in background
    recordJobStart(jobId, metadata);
    processDocumentWithLlamaParse({ documentType, clientId, agentName, documentId, documentUrl }, jobId);

    return new Response(JSON.stringify({
      success: true,
      jobId,
      status: 'pending',
      message: 'Document processing started',
      metadata
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 202
    });

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
