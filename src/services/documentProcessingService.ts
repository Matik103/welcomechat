
import { supabase } from "@/integrations/supabase/client";
import { createActivityDirect } from "@/services/clientActivityService";
import { ActivityType } from "@/types/activity";
import { callRpcFunction } from "@/utils/rpcUtils";

/**
 * Service for processing documents
 */
export class DocumentProcessingService {
  /**
   * Get pending documents that need processing
   * @returns An array of pending documents
   */
  static async getPendingDocuments(): Promise<any[]> {
    try {
      // Use the right approach with RPC function to safely check and query the table
      const data = await callRpcFunction('get_pending_documents', {});
      
      if (!data) {
        return [];
      }
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching pending documents:", error);
      return [];
    }
  }
  
  /**
   * Process a document by ID
   * @param documentId The document ID to process
   * @returns True if successful, false otherwise
   */
  static async processDocument(documentId: string): Promise<boolean> {
    try {
      console.log(`Processing document ${documentId}`);
      
      // Get document details using RPC function for type safety
      const document = await callRpcFunction('get_document_by_id', {
        document_id_param: documentId
      });
      
      if (!document) {
        console.error("Document not found");
        return false;
      }
      
      // Safety check - only proceed if we have valid document data
      if (!document.client_id) {
        console.error(`Invalid document data for ID ${documentId}`);
        return false;
      }
      
      // Update document status to 'processing' using RPC
      await callRpcFunction('update_document_status', {
        document_id_param: documentId,
        status_param: 'processing'
      });
      
      // Log activity for document processing started
      await createActivityDirect(
        document.client_id,
        'document_processing_started' as ActivityType,
        `Document processing started for ${document.document_name || document.name || documentId}`,
        { document_id: documentId, document_url: document.document_url || document.url }
      );
      
      // Call the function to process the document
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'process-document',
        {
          body: {
            document_id: documentId,
            client_id: document.client_id
          }
        }
      );
      
      if (processError) {
        console.error("Error processing document:", processError);
        
        // Update document status to 'failed' using RPC
        await callRpcFunction('update_document_status', {
          document_id_param: documentId,
          status_param: 'failed',
          error_message_param: processError.message
        });
        
        // Log activity for document processing failed
        await createActivityDirect(
          document.client_id,
          'document_processing_failed' as ActivityType,
          `Document processing failed for ${document.document_name || document.name || documentId}`,
          { 
            document_id: documentId, 
            error: processError.message
          }
        );
        
        return false;
      }
      
      // Update document status to 'processed' using RPC
      await callRpcFunction('update_document_status', {
        document_id_param: documentId,
        status_param: 'processed',
        processed_at_param: new Date().toISOString()
      });
      
      // Log activity for document processing completed
      await createActivityDirect(
        document.client_id,
        'document_processing_completed' as ActivityType,
        `Document processing completed for ${document.document_name || document.name || documentId}`,
        { document_id: documentId }
      );
      
      return true;
    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      
      try {
        // Try to update document status to 'failed' using RPC
        await callRpcFunction('update_document_status', {
          document_id_param: documentId,
          status_param: 'failed',
          error_message_param: error instanceof Error ? error.message : "Unknown error"
        });
      } catch (updateError) {
        console.error("Failed to update document status after error:", updateError);
      }
      
      return false;
    }
  }

  /**
   * Get a document by ID
   * @param id The document ID
   * @returns The document data
   */
  static async getDocumentById(id: string): Promise<any> {
    try {
      const data = await callRpcFunction('get_document_by_id', {
        document_id_param: id
      });
      
      return data;
    } catch (error) {
      console.error(`Error getting document with ID ${id}:`, error);
      return null;
    }
  }
}

// Export the class
export default DocumentProcessingService;
