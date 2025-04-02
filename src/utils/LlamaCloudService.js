
import { supabase } from '../integrations/supabase/client';
import { LLAMA_CLOUD_API_KEY } from '../config/env';
import { LlamaExtractionService } from './LlamaExtractionService';

// Base URL for Llama Cloud API
const LLAMA_API_BASE = 'https://api.cloud.llamaindex.ai/api/v1';

export class LlamaCloudService {
  /**
   * Parse a document URL with LlamaParse
   * @param {string} url Document URL
   * @param {string} documentType Document type
   * @param {string} clientId Client ID
   * @param {string} agentName Agent name
   * @returns {Promise<Object>} Parse result
   */
  static async parseDocument(url, documentType, clientId, agentName) {
    try {
      console.log(`Parsing document from URL: ${url}`);
      
      // Get API key
      const apiKey = await this.getApiKey();
      
      // Fetch the document from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }
      
      // Get the file data
      const blob = await response.blob();
      const filename = url.split('/').pop() || 'document';
      const file = new File([blob], filename, { type: `application/${documentType}` });
      
      // Upload to LlamaParse
      const uploadResult = await LlamaExtractionService.uploadDocument(file);
      
      if (!uploadResult || !uploadResult.file_id) {
        throw new Error('Failed to upload document to LlamaParse');
      }
      
      console.log(`Document uploaded to LlamaParse with file ID: ${uploadResult.file_id}`);
      
      // Start extraction job
      const jobResult = await LlamaExtractionService.startExtractionJob(uploadResult.file_id);
      
      if (!jobResult || !jobResult.job_id) {
        throw new Error('Failed to start extraction job');
      }
      
      console.log(`Extraction job started with job ID: ${jobResult.job_id}`);
      
      // Log the job information to the database
      await this.logParseJob(clientId, agentName, url, uploadResult.file_id, jobResult.job_id);
      
      // Return success - we'll check the job status later
      return {
        success: true,
        file_id: uploadResult.file_id,
        job_id: jobResult.job_id,
        message: 'Document processing started'
      };
    } catch (error) {
      console.error('Error parsing document:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Get API key from Supabase or environment
   */
  static async getApiKey() {
    try {
      // Try to get the API key from Supabase first
      const { data, error } = await supabase.functions.invoke('get-secrets', {
        body: { keys: ['LLAMA_CLOUD_API_KEY'] }
      });
      
      if (!error && data && data.LLAMA_CLOUD_API_KEY) {
        console.log('Using LLAMA_CLOUD_API_KEY from Supabase');
        return data.LLAMA_CLOUD_API_KEY;
      }
    } catch (err) {
      console.warn('Error getting LLAMA_CLOUD_API_KEY from Supabase:', err);
    }
    
    // Fallback to environment variable
    if (LLAMA_CLOUD_API_KEY) {
      console.log('Using LLAMA_CLOUD_API_KEY from environment');
      return LLAMA_CLOUD_API_KEY;
    }
    
    throw new Error('LLAMA_CLOUD_API_KEY not found in Supabase or environment');
  }
  
  /**
   * Log a parse job to the database
   */
  static async logParseJob(clientId, agentName, documentUrl, fileId, jobId) {
    try {
      const { error } = await supabase
        .from('ai_documents')
        .insert({
          client_id: clientId,
          agent_name: agentName,
          document_url: documentUrl,
          document_id: fileId,
          processing_method: 'llamaparse',
          status: 'processing',
          document_type: documentUrl.endsWith('.pdf') ? 'pdf' : 'document',
          metadata: {
            llama_file_id: fileId,
            llama_job_id: jobId,
            processing_started_at: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error logging parse job:', error);
      }
    } catch (error) {
      console.error('Error logging parse job:', error);
    }
  }
  
  /**
   * Check the status of a parse job and update the database
   */
  static async checkParseJob(jobId) {
    try {
      // Get the job record from the database
      const { data: jobRecord, error: jobError } = await supabase
        .from('ai_documents')
        .select('*')
        .eq('metadata->llama_job_id', jobId)
        .single();
      
      if (jobError || !jobRecord) {
        console.error('Error getting parse job record:', jobError || 'Job not found');
        return { success: false, error: 'Job record not found' };
      }
      
      // Check the status
      const status = await LlamaExtractionService.checkJobStatus(jobId);
      
      if (!status.exists) {
        // Update the record to indicate the job doesn't exist
        await supabase
          .from('ai_documents')
          .update({
            status: 'failed',
            error: 'Job not found in LlamaParse',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobRecord.id);
          
        return { success: false, error: 'Job not found in LlamaParse' };
      }
      
      if (status.status === 'COMPLETED') {
        // Job completed, get the result
        const result = await LlamaExtractionService.getExtractionResult(jobId);
        
        // Update the record with the result
        await supabase
          .from('ai_documents')
          .update({
            status: 'completed',
            content: result.content || result.text || '',
            metadata: {
              ...jobRecord.metadata,
              extraction_result: result,
              completed_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', jobRecord.id);
          
        // Update the ai_agents record if it exists
        await this.updateAgentRecord(
          jobRecord.client_id, 
          jobRecord.agent_name, 
          jobRecord.document_url, 
          result.content || result.text || ''
        );
          
        return { success: true, status: 'completed', result };
      }
      
      if (status.status === 'FAILED') {
        // Job failed
        await supabase
          .from('ai_documents')
          .update({
            status: 'failed',
            error: 'Extraction job failed',
            metadata: {
              ...jobRecord.metadata,
              failed_at: new Date().toISOString(),
              error_details: status.data
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', jobRecord.id);
          
        return { success: false, status: 'failed', error: 'Extraction job failed' };
      }
      
      // Job still processing
      await supabase
        .from('ai_documents')
        .update({
          metadata: {
            ...jobRecord.metadata,
            last_checked_at: new Date().toISOString(),
            job_status: status.status
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', jobRecord.id);
        
      return { success: true, status: 'processing', jobStatus: status.status };
    } catch (error) {
      console.error('Error checking parse job:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update the AI agent record with extracted content
   */
  static async updateAgentRecord(clientId, agentName, documentUrl, content) {
    try {
      // Find the AI agent record
      const { data: agentRecord, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', clientId)
        .eq('url', documentUrl)
        .eq('interaction_type', 'document')
        .single();
      
      if (agentError || !agentRecord) {
        console.log('AI agent record not found, creating new one');
        
        // Create a new record
        await supabase
          .from('ai_agents')
          .insert({
            client_id: clientId,
            name: agentName,
            interaction_type: 'document',
            url: documentUrl,
            content: content,
            settings: {
              title: documentUrl.split('/').pop() || 'Document',
              document_type: documentUrl.endsWith('.pdf') ? 'pdf' : 'document',
              processing_method: 'llamaparse',
              processed_at: new Date().toISOString()
            },
            status: 'active',
            type: documentUrl.endsWith('.pdf') ? 'pdf' : 'document',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } else {
        // Update the existing record
        await supabase
          .from('ai_agents')
          .update({
            content: content,
            settings: {
              ...agentRecord.settings,
              processing_method: 'llamaparse',
              processed_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', agentRecord.id);
      }
    } catch (error) {
      console.error('Error updating AI agent record:', error);
    }
  }
  
  /**
   * Verify the assistant integration for testing purposes
   */
  static async verifyAssistantIntegration() {
    try {
      // Check if we can get the API key
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        return { success: false, error: 'API key not found' };
      }
      
      // Make a simple API call to verify
      const response = await fetch(`${LLAMA_API_BASE}/files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `API call failed: ${response.status} ${response.statusText} - ${errorText}` };
      }
      
      const result = await response.json();
      
      return { 
        success: true, 
        message: 'LlamaParse integration verified successfully',
        filesCount: result.length || 0
      };
    } catch (error) {
      console.error('Error verifying assistant integration:', error);
      return { success: false, error: error.message };
    }
  }
}
