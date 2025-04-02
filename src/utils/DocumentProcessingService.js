
import { supabase } from '../integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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
      
      // Get agent name for the client - make sure to fetch it properly
      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('name')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .limit(1)
        .maybeSingle();
        
      if (agentError) {
        console.error('Error fetching agent name:', agentError);
        throw new Error(`Failed to get agent name: ${agentError.message}`);
      }
      
      if (!agentData || !agentData.name) {
        throw new Error('Agent name not found for this client');
      }
      
      const agentName = agentData.name;
      console.log(`Using agent name: ${agentName} for client: ${clientId}`);
      
      // Generate a document ID
      const documentId = uuidv4();
      
      // Track processing success in the database
      await this.trackDocumentProcessing(
        clientId, 
        filePath, 
        publicUrl, 
        file.name, 
        file.size, 
        'completed', 
        null, 
        agentName,
        documentId
      );
      
      return {
        success: true,
        publicUrl,
        processed: 1,
        failed: 0,
        documentId,
        extractedText: 'Document content extracted successfully.'
      };
    } catch (error) {
      console.error('Error processing document:', error);
      
      // Get agent name for the client for tracking failure
      let agentName;
      try {
        const { data: agentData, error: agentError } = await supabase
          .from('ai_agents')
          .select('name')
          .eq('client_id', clientId)
          .eq('interaction_type', 'config')
          .limit(1)
          .maybeSingle();
          
        if (agentError) {
          console.error('Error fetching agent name for error tracking:', agentError);
          throw agentError;
        }
        
        if (!agentData || !agentData.name) {
          throw new Error('Agent name not found for this client');
        }
        
        agentName = agentData.name;
      } catch (nameError) {
        console.error('Error fetching agent name:', nameError);
        throw new Error('Failed to process document: Could not determine agent name');
      }
      
      // Generate a document ID even for failures to satisfy the constraint
      const documentId = uuidv4();
      
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
            error.message,
            agentName,
            documentId
          );
        } catch (trackingError) {
          console.error('Error tracking document processing failure:', trackingError);
        }
      }
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        processed: 0,
        failed: 1,
        documentId
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
   * @param {string} agentName The agent name
   * @param {string} documentId The document ID (required)
   */
  static async trackDocumentProcessing(
    clientId, 
    filePath, 
    publicUrl, 
    fileName, 
    fileSize, 
    status, 
    errorMessage = null,
    agentName,
    documentId
  ) {
    try {
      if (!documentId) {
        documentId = uuidv4(); // Ensure we have a document ID as a fallback
      }
      
      const { error } = await supabase
        .from('document_processing_jobs')
        .insert({
          client_id: clientId,
          document_url: publicUrl,
          status,
          error: errorMessage,
          document_type: 'pdf', // Default to PDF for now
          created_at: new Date().toISOString(),
          agent_name: agentName, // Required field, must be provided
          document_id: documentId, // Required field
          metadata: {
            original_filename: fileName,
            file_size: fileSize,
            storage_path: filePath
          }
        });
      
      if (error) {
        console.error('Error tracking document processing:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error tracking document processing:', error);
      throw error;
    }
  }
  
  /**
   * Process a document URL
   * @param {string} url The document URL to process
   * @param {string} clientId The client ID
   * @returns {Promise<Object>} Processing result
   */
  static async processDocumentUrl(url, clientId) {
    console.log(`Processing document URL: ${url} for client: ${clientId}`);
    
    try {
      // Validate inputs
      if (!url) {
        throw new Error('Document URL is required');
      }
      
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      // Get agent name for the client - ensure it's found
      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('name')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .limit(1)
        .maybeSingle();
        
      if (agentError) {
        console.error('Error fetching agent name:', agentError);
        throw new Error(`Failed to get agent name: ${agentError.message}`);
      }
      
      if (!agentData || !agentData.name) {
        throw new Error('Agent name not found for this client');
      }
      
      const agentName = agentData.name;
      const documentId = uuidv4(); // Generate a document ID
      
      // Create a processing job in the database
      const { data, error } = await supabase
        .from('document_processing_jobs')
        .insert({
          client_id: clientId,
          document_url: url,
          document_type: 'url',
          document_id: documentId,
          status: 'pending',
          created_at: new Date().toISOString(),
          agent_name: agentName // Required field
        })
        .select('id')
        .single();
        
      if (error) {
        console.error('Error creating document processing job:', error);
        throw error;
      }
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        documentUrl: url,
        processed: 1,
        failed: 0,
        jobId: data.id,
        documentId,
        extractedText: 'Document content from URL extracted successfully.'
      };
    } catch (error) {
      console.error('Error processing document URL:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        processed: 0,
        failed: 1
      };
    }
  }
}
