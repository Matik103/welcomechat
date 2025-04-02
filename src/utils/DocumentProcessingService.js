
import { LLAMA_EXTRACTION_AGENT_ID } from '../config/env';
import { LlamaExtractionService } from './LlamaExtractionService';
import { supabase } from '../integrations/supabase/client';
import { DOCUMENTS_BUCKET } from './supabaseStorage';

export class DocumentProcessingService {
  /**
   * Process a document for an AI assistant
   * @param {File} file The document file to process
   * @param {string} clientId The client ID
   * @returns {Promise<Object>} Processing result
   */
  static async processDocument(file, clientId) {
    console.log(`Processing document: ${file.name} for client: ${clientId}`);
    
    try {
      // Make sure the file is valid
      if (!file || !file.name) {
        throw new Error('Invalid file');
      }
      
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      // Create a unique filename to avoid collisions
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${clientId}/${fileName}`;
      
      console.log(`Uploading to path: ${filePath} in bucket: ${DOCUMENTS_BUCKET}`);
      
      // Upload the original file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(DOCUMENTS_BUCKET)
        .getPublicUrl(filePath);
      
      console.log(`File uploaded successfully. Public URL: ${publicUrl}`);
      
      // Upload to Llama Cloud for extraction
      console.log('Uploading document to LlamaParse...');
      const uploadResult = await LlamaExtractionService.uploadDocument(file);
      
      if (!uploadResult || !uploadResult.file_id) {
        throw new Error('Failed to upload file to LlamaParse');
      }
      
      console.log('Starting extraction job...');
      const jobResult = await LlamaExtractionService.startExtractionJob(
        uploadResult.file_id,
        LLAMA_EXTRACTION_AGENT_ID
      );
      
      if (!jobResult || !jobResult.job_id) {
        throw new Error('Failed to start extraction job');
      }
      
      // Track processing in the database
      await this.trackDocumentProcessing(clientId, filePath, publicUrl, file.name, file.size, 'processing', null, {
        llama_file_id: uploadResult.file_id,
        llama_job_id: jobResult.job_id
      });
      
      // For immediate response, don't wait for extraction to complete
      return {
        success: true,
        fileId: uploadResult.file_id,
        jobId: jobResult.job_id,
        publicUrl,
        processed: 0,
        failed: 0,
        status: 'processing'
      };
    } catch (error) {
      console.error('Error processing document:', error);
      
      // Track processing failure in the database
      if (clientId) {
        try {
          await this.trackDocumentProcessing(
            clientId, 
            null, 
            null, 
            file?.name || 'unknown', 
            file?.size || 0, 
            'failed',
            error.message
          );
        } catch (trackingError) {
          console.error('Error tracking document processing failure:', trackingError);
        }
      }
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        processed: 0,
        failed: 1
      };
    }
  }
  
  /**
   * Track document processing in the database
   * @param {string} clientId The client ID
   * @param {string} filePath The file path in storage
   * @param {string} publicUrl The public URL of the file
   * @param {string} fileName The original file name
   * @param {number} fileSize The file size in bytes
   * @param {string} status The processing status
   * @param {string} errorMessage Optional error message
   * @param {Object} metadata Additional metadata
   */
  static async trackDocumentProcessing(
    clientId, 
    filePath, 
    publicUrl, 
    fileName, 
    fileSize, 
    status, 
    errorMessage = null,
    metadata = {}
  ) {
    try {
      const { error } = await supabase
        .from('document_processing')
        .insert({
          client_id: clientId,
          file_path: filePath,
          public_url: publicUrl,
          file_name: fileName,
          file_size: fileSize,
          status,
          error_message: errorMessage,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error tracking document processing:', error);
      }
    } catch (error) {
      console.error('Error tracking document processing:', error);
    }
  }
  
  /**
   * Get processing status for a document from Llama
   * @param {string} jobId The job ID from Llama
   */
  static async getProcessingStatus(jobId) {
    try {
      const result = await LlamaExtractionService.checkJobStatus(jobId);
      return result;
    } catch (error) {
      console.error('Error getting processing status:', error);
      return {
        exists: false,
        status: 'error',
        error: error.message
      };
    }
  }
}
