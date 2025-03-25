
import { supabase } from "@/integrations/supabase/client";
import { DocumentProcessingService } from "@/services/documentProcessingService";

/**
 * Process existing documents
 * @param clientId Optional client ID to filter by
 * @returns The processed documents
 */
export const processExistingDocuments = async (clientId?: string): Promise<any[]> => {
  try {
    console.log(`Processing existing documents${clientId ? ` for client ${clientId}` : ''}`);
    
    // Get pending documents
    const pendingDocuments = await DocumentProcessingService.getPendingDocuments();
    
    // Filter by client ID if provided
    const documents = clientId 
      ? pendingDocuments.filter(doc => doc.client_id === clientId)
      : pendingDocuments;
    
    console.log(`Found ${documents.length} pending documents to process`);
    
    // Process each document
    const results = await Promise.all(
      documents.map(async doc => {
        try {
          const processed = await DocumentProcessingService.processDocument(doc.id.toString());
          return {
            id: doc.id,
            success: processed,
            document_url: doc.document_url
          };
        } catch (error) {
          console.error(`Error processing document ${doc.id}:`, error);
          return {
            id: doc.id,
            success: false,
            document_url: doc.document_url,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      })
    );
    
    return results;
  } catch (error) {
    console.error("Error in processExistingDocuments:", error);
    throw error;
  }
};
