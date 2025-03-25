
import { supabase } from "@/integrations/supabase/client";
import { createActivityDirect } from "@/services/clientActivityService";
import { ActivityType } from "@/types/activity";

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
      // Query documents with status 'pending' or 'needs_processing'
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .in('status', ['pending', 'needs_processing'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
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
      
      // Get document details
      const { data: document, error: fetchError } = await supabase
        .from('client_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching document:", fetchError);
        return false;
      }
      
      if (!document) {
        console.error(`Document ${documentId} not found`);
        return false;
      }
      
      // Update document status to 'processing'
      const { error: updateError } = await supabase
        .from('client_documents')
        .update({ status: 'processing' })
        .eq('id', documentId);
      
      if (updateError) {
        console.error("Error updating document status:", updateError);
        return false;
      }
      
      // Log activity for document processing started
      await createActivityDirect(
        document.client_id,
        'document_processing_started' as ActivityType,
        `Document processing started for ${document.document_name || documentId}`,
        { document_id: documentId, document_url: document.document_url }
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
        
        // Update document status to 'failed'
        await supabase
          .from('client_documents')
          .update({ 
            status: 'failed',
            error_message: processError.message
          })
          .eq('id', documentId);
        
        // Log activity for document processing failed
        await createActivityDirect(
          document.client_id,
          'document_processing_failed' as ActivityType,
          `Document processing failed for ${document.document_name || documentId}`,
          { 
            document_id: documentId, 
            error: processError.message
          }
        );
        
        return false;
      }
      
      // Update document status to 'processed'
      await supabase
        .from('client_documents')
        .update({ 
          status: 'processed',
          processed_at: new Date().toISOString()
        })
        .eq('id', documentId);
      
      // Log activity for document processing completed
      await createActivityDirect(
        document.client_id,
        'document_processing_completed' as ActivityType,
        `Document processing completed for ${document.document_name || documentId}`,
        { document_id: documentId }
      );
      
      return true;
    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      
      try {
        // Try to update document status to 'failed'
        await supabase
          .from('client_documents')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : "Unknown error"
          })
          .eq('id', documentId);
      } catch (updateError) {
        console.error("Failed to update document status after error:", updateError);
      }
      
      return false;
    }
  }
}

// Export the class
export default DocumentProcessingService;
