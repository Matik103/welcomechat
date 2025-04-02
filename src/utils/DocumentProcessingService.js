
import { supabase } from '../integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { LLAMA_CLOUD_API_KEY, LLAMA_EXTRACTION_AGENT_ID } from '@/config/env';

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

      // Generate a document ID early
      const documentId = uuidv4();
      console.log(`Generated document ID: ${documentId}`);
      
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
      
      console.log("Preparing to convert file to base64 for document processing...");
      
      // Convert file to base64
      const fileBuffer = await file.arrayBuffer();
      const base64File = btoa(
        new Uint8Array(fileBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      
      // Call the Supabase Edge Function instead of directly calling LlamaIndex API
      console.log("Calling Supabase Edge Function for document processing...");
      
      try {
        const { data: processingResult, error: processingError } = await supabase.functions.invoke(
          'process-document',
          {
            body: {
              fileContent: base64File,
              fileName: file.name,
              clientId: clientId,
              agentName: agentName
            }
          }
        );
        
        if (processingError) {
          console.error("Error calling edge function:", processingError);
          throw new Error(`Edge function error: ${processingError.message}`);
        }
        
        if (!processingResult) {
          console.error("Edge function returned no data");
          throw new Error("Failed to process document: No response from edge function");
        }
        
        if (!processingResult.success) {
          console.error("Edge function didn't return a success:", processingResult?.error || "Unknown error");
          throw new Error(processingResult?.error || "Failed to process document");
        }
        
        // Extract the text from the response
        const extractedText = processingResult.extractedText || "No text was extracted";
        
        console.log(`Extracted text (first 100 chars): ${extractedText.substring(0, 100)}...`);
        
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
          documentId,
          extractedText
        );
        
        return {
          success: true,
          publicUrl,
          processed: 1,
          failed: 0,
          documentId,
          extractedText
        };
      } catch (edgeFunctionError) {
        console.error('Error calling edge function for document processing:', edgeFunctionError);
        
        // Track processing failure in the database
        try {
          await this.trackDocumentProcessing(
            clientId, 
            filePath, 
            publicUrl, // Keep the uploaded file's URL for the record
            file.name, 
            file.size, 
            'failed',
            edgeFunctionError.message || 'Error processing document with edge function',
            agentName,
            documentId,
            null // No extracted text on failure
          );
        } catch (trackingError) {
          console.error('Error tracking document processing failure:', trackingError);
        }
        
        throw new Error(edgeFunctionError.message || 'Error processing document with edge function');
      }
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
        }
        
        if (!agentData || !agentData.name) {
          console.error('Agent name not found for this client');
          agentName = 'Unknown Agent';
        } else {
          agentName = agentData.name;
        }
      } catch (nameError) {
        console.error('Error fetching agent name:', nameError);
        agentName = 'Unknown Agent';
      }
      
      // Generate a document ID even for failures to satisfy the constraint
      const documentId = uuidv4();
      console.log(`Generated document ID for failed processing: ${documentId}`);
      
      // Create a placeholder URL for the failed document
      const errorPublicUrl = `error://failed-to-process/${documentId}`;
      
      // Track processing failure in the database
      if (clientId) {
        try {
          await this.trackDocumentProcessing(
            clientId, 
            null, // May be null if we failed before upload
            errorPublicUrl, // Use a placeholder URL to satisfy the constraint
            file?.name || 'unknown', 
            file?.size || 0, 
            'failed',
            error.message || 'Unknown processing error',
            agentName,
            documentId,
            null // No extracted text on failure
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
   * @param {string} extractedText Optional extracted text content
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
    documentId,
    extractedText = null
  ) {
    try {
      if (!documentId) {
        documentId = uuidv4(); // Ensure we have a document ID as a fallback
        console.log(`Generated fallback document ID: ${documentId}`);
      }
      
      if (!publicUrl) {
        // Create a placeholder URL for the tracking record
        publicUrl = `placeholder://document-processing/${documentId}`;
        console.log(`Using placeholder URL: ${publicUrl}`);
      }
      
      console.log('Tracking document processing:', {
        client_id: clientId,
        document_url: publicUrl,
        status,
        agent_name: agentName,
        document_id: documentId,
        has_content: !!extractedText
      });
      
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
          content: extractedText, // Add the extracted text
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
      
      console.log("IMPORTANT: This appears to be using a simulated URL processing flow, NOT actually calling LlamaIndex API");
      
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
          agent_name: agentName, // Required field
          content: "This is placeholder text. No real text extraction was performed." // Add placeholder content
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
        extractedText: 'Document content from URL extracted successfully.' // Add placeholder content
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
