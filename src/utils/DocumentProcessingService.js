
import { supabase } from '../integrations/supabase/client';

// Constant for the storage bucket name
const DOCUMENT_STORAGE_BUCKET = 'document-storage';

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
      
      console.log(`Uploading to path: ${filePath} in bucket: ${DOCUMENT_STORAGE_BUCKET}`);
      
      // Upload the original file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(DOCUMENT_STORAGE_BUCKET)
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
        .from(DOCUMENT_STORAGE_BUCKET)
        .getPublicUrl(filePath);
      
      console.log(`File uploaded successfully. Public URL: ${publicUrl}`);
      
      // Track processing success in the database
      await this.trackDocumentProcessing(clientId, filePath, publicUrl, file.name, file.size, 'completed');
      
      return {
        success: true,
        publicUrl,
        processed: 1,
        failed: 0
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
   */
  static async trackDocumentProcessing(
    clientId, 
    filePath, 
    publicUrl, 
    fileName, 
    fileSize, 
    status, 
    errorMessage = null
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
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error tracking document processing:', error);
      }
    } catch (error) {
      console.error('Error tracking document processing:', error);
    }
  }
}
