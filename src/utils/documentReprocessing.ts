import { supabase } from "@/integrations/supabase/client";
import { DocumentProcessingService } from "@/services/documentProcessingService";
import { createActivityDirect } from "@/services/clientActivityService";
import { toast } from "sonner";

/**
 * Reprocess document function that handles failures and retries
 * @param document The document to reprocess
 * @returns Success status and message
 */
export const reprocessDocument = async (document: any): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate document data
    if (!document || !document.id || !document.client_id || !document.document_url) {
      return {
        success: false,
        message: "Invalid document data for reprocessing"
      };
    }

    console.log(`Reprocessing document ${document.id} for client ${document.client_id}`);

    // Update document status to "pending"
    const { error: updateError } = await supabase
      .from("document_processing_jobs")
      .update({
        status: "pending",
        error: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", document.id);

    if (updateError) {
      console.error("Error updating document status:", updateError);
      return {
        success: false,
        message: `Failed to update document status: ${updateError.message}`
      };
    }

    // Log activity
    await createActivityDirect(
      document.client_id,
      "document_processing_started",
      `Reprocessing document: ${document.document_type || 'Unknown type'}`,
      {
        document_id: document.id,
        document_url: document.document_url
      }
    );

    // Process document
    const processResult = await DocumentProcessingService.processDocument(document.id);

    if (!processResult) {
      throw new Error("Document processing service returned false");
    }

    return {
      success: true,
      message: `Document reprocessing started for ${document.document_url}`
    };
  } catch (error) {
    console.error("Error reprocessing document:", error);
    
    // Update document status to "failed" with error
    try {
      await supabase
        .from("document_processing_jobs")
        .update({
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error during reprocessing",
          updated_at: new Date().toISOString()
        })
        .eq("id", document.id);
    } catch (updateError) {
      console.error("Failed to update document error status:", updateError);
    }

    return {
      success: false,
      message: `Failed to reprocess document: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Process multiple pending documents
 * @param limit The maximum number of documents to process
 * @returns The number of documents processed
 */
export const processAllPendingDocuments = async (limit: number = 10): Promise<number> => {
  try {
    const pendingDocuments = await DocumentProcessingService.getPendingDocuments();
    
    if (!pendingDocuments || pendingDocuments.length === 0) {
      console.log("No pending documents found for processing");
      return 0;
    }
    
    console.log(`Found ${pendingDocuments.length} pending documents, processing up to ${limit}`);
    
    let processedCount = 0;
    const documentsToProcess = pendingDocuments.slice(0, limit);
    
    for (const document of documentsToProcess) {
      try {
        // Convert document ID to string if it's a number
        const documentId = typeof document.id === 'number' ? document.id.toString() : document.id;
        
        console.log(`Processing document ${documentId} for client ${document.client_id}`);
        
        // Process document
        const processResult = await DocumentProcessingService.processDocument(documentId);
        
        if (processResult) {
          processedCount++;
          console.log(`Successfully processed document ${documentId}`);
        } else {
          console.error(`Failed to process document ${documentId}`);
        }
      } catch (docError) {
        console.error(`Error processing document ${document.id}:`, docError);
      }
    }
    
    console.log(`Processed ${processedCount} out of ${documentsToProcess.length} documents`);
    return processedCount;
  } catch (error) {
    console.error("Error in processAllPendingDocuments:", error);
    throw error;
  }
};

/**
 * Reprocess all failed documents
 */
export const reprocessAllFailedDocuments = async (): Promise<void> => {
  try {
    // Fetch all failed documents
    const { data: failedDocuments, error: fetchError } = await supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('status', 'failed');

    if (fetchError) {
      console.error("Error fetching failed documents:", fetchError);
      toast.error(`Failed to fetch failed documents: ${fetchError.message}`);
      return;
    }

    if (!failedDocuments || failedDocuments.length === 0) {
      console.log("No failed documents found for reprocessing");
      toast.info("No failed documents found for reprocessing");
      return;
    }

    console.log(`Found ${failedDocuments.length} failed documents, reprocessing all`);

    // Reprocess each failed document
    for (const document of failedDocuments) {
      try {
        const reprocessResult = await reprocessDocument(document);

        if (reprocessResult.success) {
          console.log(`Reprocessing started for document ${document.id}`);
          toast.success(reprocessResult.message);
        } else {
          console.error(`Failed to start reprocessing for document ${document.id}:`, reprocessResult.message);
          toast.error(reprocessResult.message);
        }
      } catch (reprocessError) {
        console.error(`Error reprocessing document ${document.id}:`, reprocessError);
        toast.error(`Error reprocessing document ${document.id}: ${reprocessError instanceof Error ? reprocessError.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error("Error in reprocessAllFailedDocuments:", error);
    toast.error(`Failed to reprocess all failed documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
