
import { supabase } from "@/integrations/supabase/client";
import { DocumentProcessingService } from "@/services/documentProcessingService";

interface ProcessDocumentResult {
  id: number | string;
  success: boolean;
  document_url?: string;
  error?: string;
}

interface ProcessingResults {
  processed: ProcessDocumentResult[];
  failed: ProcessDocumentResult[];
  success: boolean;
}

/**
 * Process existing documents
 * @param clientId Optional client ID to filter by
 * @returns The processed documents with success/failure counts
 */
export const processExistingDocuments = async (clientId?: string): Promise<ProcessingResults> => {
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
    
    // Separate successful and failed documents
    const processed = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    return {
      processed,
      failed,
      success: true
    };
  } catch (error) {
    console.error("Error in processExistingDocuments:", error);
    return {
      processed: [],
      failed: [],
      success: false
    };
  }
};
