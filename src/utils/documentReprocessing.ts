
import { supabase } from '@/integrations/supabase/client';
import { LlamaExtractionService } from './LlamaExtractionService';
import { LLAMA_EXTRACTION_AGENT_ID } from '@/config/env';
import { DocumentProcessingResult } from '@/types/document-processing';
import { JsonObject, toJson } from '@/types/supabase-extensions';

/**
 * Process existing documents using LlamaParse
 * @param clientId The client ID to process documents for
 * @param agentName The agent name for tracking
 * @returns ProcessingResult
 */
export async function processExistingDocuments(
  clientId: string,
  agentName: string
): Promise<DocumentProcessingResult> {
  console.log(`Processing existing documents for client ${clientId} with agent ${agentName}`);
  
  let processed = 0;
  let failed = 0;
  
  try {
    // Get all document agents that haven't been processed with LlamaParse yet
    const { data: documents, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('client_id', clientId)
      .eq('interaction_type', 'document')
      .is('settings->processing_method', null);
    
    if (error) {
      throw error;
    }
    
    if (!documents || documents.length === 0) {
      console.log('No documents found that need processing');
      return {
        success: true,
        processed: 0,
        failed: 0,
        message: 'No documents found that need processing'
      };
    }
    
    console.log(`Found ${documents.length} documents to process`);
    
    // Process each document
    for (const doc of documents) {
      try {
        const documentUrl = doc.url;
        const documentType = doc.type || 'pdf';
        const settings = doc.settings as JsonObject | null;
        
        // Safely extract title with type checking
        const documentTitle = settings && typeof settings === 'object' && 'title' in settings 
          ? String(settings.title) 
          : doc.name || 'Untitled Document';
        
        console.log(`Processing document: ${documentTitle} (${documentUrl})`);
        
        // Get file from URL
        const response = await fetch(documentUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const file = new File([blob], documentTitle, { type: `application/${documentType}` });
        
        // Upload to LlamaParse
        const uploadResult = await LlamaExtractionService.uploadDocument(file);
        
        if (!uploadResult || !uploadResult.file_id) {
          throw new Error('Failed to upload to LlamaParse');
        }
        
        // Start extraction job
        const jobResult = await LlamaExtractionService.startExtractionJob(
          uploadResult.file_id,
          LLAMA_EXTRACTION_AGENT_ID
        );
        
        if (!jobResult || !jobResult.job_id) {
          throw new Error('Failed to start extraction job');
        }
        
        // Update document with processing information
        const existingSettings: JsonObject = typeof doc.settings === 'object' ? 
          (doc.settings as JsonObject) : {};
        
        const newSettings: JsonObject = {
          ...existingSettings,
          processing_method: 'llamaparse',
          llama_file_id: uploadResult.file_id,
          llama_job_id: jobResult.job_id,
          processing_started_at: new Date().toISOString()
        };
        
        await supabase
          .from('ai_agents')
          .update({
            settings: toJson(newSettings)
          })
          .eq('id', doc.id);
        
        processed++;
        console.log(`Successfully started processing for document: ${documentTitle}`);
        
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
        failed++;
        
        // Update document with error
        const errorMessage = docError instanceof Error ? docError.message : String(docError);
        const existingSettings: JsonObject = typeof doc.settings === 'object' ? 
          (doc.settings as JsonObject) : {};
        
        const newSettings: JsonObject = {
          ...existingSettings,
          processing_method: 'llamaparse',
          processing_error: errorMessage,
          processing_error_at: new Date().toISOString()
        };
        
        await supabase
          .from('ai_agents')
          .update({
            settings: toJson(newSettings)
          })
          .eq('id', doc.id);
      }
    }
    
    return {
      success: true,
      processed,
      failed,
      message: `Processed ${processed} documents with ${failed} failures`
    };
    
  } catch (error) {
    console.error('Error processing existing documents:', error);
    return {
      success: false,
      processed,
      failed: failed + 1,
      error: error instanceof Error ? error.message : String(error),
      message: `Error processing documents: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Check the status of documents being processed by LlamaParse
 * @param clientId The client ID to check documents for
 */
export async function checkProcessingDocuments(clientId: string): Promise<DocumentProcessingResult> {
  console.log(`Checking processing status for client ${clientId}`);
  
  let checked = 0;
  let completed = 0;
  let stillProcessing = 0;
  let failed = 0;
  
  try {
    // Get all documents that are being processed with LlamaParse
    const { data: documents, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('client_id', clientId)
      .eq('interaction_type', 'document')
      .eq('settings->processing_method', 'llamaparse');
    
    if (error) {
      throw error;
    }
    
    if (!documents || documents.length === 0) {
      console.log('No documents found that are being processed');
      return {
        success: true,
        processed: 0,
        failed: 0,
        message: 'No documents found that are being processed'
      };
    }
    
    console.log(`Found ${documents.length} documents to check`);
    
    // Check each document
    for (const doc of documents) {
      try {
        checked++;
        const settings = doc.settings as JsonObject | null;
        
        if (!settings || typeof settings !== 'object') {
          console.log(`Document ${doc.id} has invalid settings, skipping`);
          continue;
        }
        
        // Safely handle jobId extraction
        const jobId = settings.llama_job_id ? String(settings.llama_job_id) : null;
        
        if (!jobId) {
          console.log(`Document ${doc.id} has no job ID, skipping`);
          continue;
        }
        
        // Safely check for completion status
        const isCompleted = settings.processing_completed_at !== undefined;
        const isFailed = settings.processing_failed_at !== undefined;
        
        // If already completed or failed, skip
        if (isCompleted || isFailed) {
          console.log(`Document ${doc.id} already processed, skipping`);
          completed++;
          continue;
        }
        
        console.log(`Checking status for document ${doc.id} with job ID ${jobId}`);
        
        // Check job status
        const result = await LlamaExtractionService.checkJobStatus(jobId);
        
        if (!result.exists) {
          throw new Error('Job does not exist');
        }
        
        if (result.status === 'COMPLETED') {
          // Job completed, get result
          const extractionResult = await LlamaExtractionService.getExtractionResult(jobId);
          
          // Update document with result
          const updatedSettings: JsonObject = {
            ...settings,
            processing_completed_at: new Date().toISOString(),
            extraction_result: extractionResult
          };
          
          await supabase
            .from('ai_agents')
            .update({
              content: extractionResult.content || extractionResult.text || "",
              settings: toJson(updatedSettings)
            })
            .eq('id', doc.id);
          
          completed++;
          console.log(`Successfully processed document ${doc.id}`);
        } else if (result.status === 'FAILED') {
          // Job failed
          const updatedSettings: JsonObject = {
            ...settings,
            processing_failed_at: new Date().toISOString(),
            processing_error: 'Extraction job failed',
            job_status: result.status
          };
          
          await supabase
            .from('ai_agents')
            .update({
              settings: toJson(updatedSettings)
            })
            .eq('id', doc.id);
          
          failed++;
          console.log(`Document ${doc.id} processing failed`);
        } else {
          // Still processing
          stillProcessing++;
          console.log(`Document ${doc.id} is still processing (status: ${result.status})`);
        }
        
      } catch (docError) {
        console.error(`Error checking document ${doc.id}:`, docError);
        failed++;
        
        // Update document with error
        const errorMessage = docError instanceof Error ? docError.message : String(docError);
        const settings = doc.settings as JsonObject | null;
        
        const updatedSettings: JsonObject = {
          ...(typeof settings === 'object' ? settings || {} : {}),
          processing_error: errorMessage,
          processing_error_at: new Date().toISOString()
        };
        
        await supabase
          .from('ai_agents')
          .update({
            settings: toJson(updatedSettings)
          })
          .eq('id', doc.id);
      }
    }
    
    return {
      success: true,
      processed: completed,
      failed,
      message: `Checked ${checked} documents: ${completed} completed, ${stillProcessing} still processing, ${failed} failed`
    };
    
  } catch (error) {
    console.error('Error checking processing documents:', error);
    return {
      success: false,
      processed: completed,
      failed: failed + 1,
      error: error instanceof Error ? error.message : String(error),
      message: `Error checking documents: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
