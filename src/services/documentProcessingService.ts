
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
      // Check if client_documents table exists
      const { data: tableExists } = await supabase
        .from('client_documents')
        .select('*')
        .limit(1)
        .catch(() => ({ data: null }));
      
      // If table doesn't exist, return empty array
      if (!tableExists) {
        console.warn("The client_documents table does not exist");
        return [];
      }
      
      // Query documents with status 'pending' or 'needs_processing'
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .in('status', ['pending', 'needs_processing'])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching pending documents:", error);
        return [];
      }
      
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
      
      // Get document details - handle the case where the table might not exist
      const { data: document, error: fetchError } = await supabase
        .from('client_documents')
        .select('*')
        .eq('id', documentId)
        .single()
        .catch(err => {
          console.error("Error in document fetch:", err);
          return { data: null, error: err };
        });
      
      if (fetchError || !document) {
        console.error("Error fetching document:", fetchError || "Document not found");
        return false;
      }
      
      // Safety check - only proceed if we have valid document data
      if (!document || !document.client_id) {
        console.error(`Invalid document data for ID ${documentId}`);
        return false;
      }
      
      // Update document status to 'processing'
      const { error: updateError } = await supabase
        .from('client_documents')
        .update({ status: 'processing' })
        .eq('id', documentId)
        .catch(err => {
          console.error("Error in document update:", err);
          return { error: err };
        });
      
      if (updateError) {
        console.error("Error updating document status:", updateError);
        return false;
      }
      
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
        
        // Update document status to 'failed'
        await supabase
          .from('client_documents')
          .update({ 
            status: 'failed',
            error_message: processError.message
          })
          .eq('id', documentId)
          .catch(err => console.error("Error updating document status after failure:", err));
        
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
      
      // Update document status to 'processed'
      await supabase
        .from('client_documents')
        .update({ 
          status: 'processed',
          processed_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .catch(err => console.error("Error updating document status after processing:", err));
      
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
        // Try to update document status to 'failed'
        await supabase
          .from('client_documents')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : "Unknown error"
          })
          .eq('id', documentId)
          .catch(() => console.error("Failed to update document status after error"));
      } catch (updateError) {
        console.error("Failed to update document status after error:", updateError);
      }
      
      return false;
    }
  }

  /**
   * Mock function for document retrieval when table doesn't exist
   */
  static async getDocumentById(id: string): Promise<any> {
    console.log(`Attempting to get document ${id} (mock function)`);
    return null;
  }
}

// Export the class
export default DocumentProcessingService;
