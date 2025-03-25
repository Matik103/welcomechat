
import { supabase } from "@/integrations/supabase/client";
import { LlamaCloudService } from "@/utils/LlamaCloudService";
import { DocumentProcessingService } from "@/services/documentProcessingService";
import { toast } from "sonner";

/**
 * Process existing documents with LlamaParse
 * @param clientId Client ID to process documents for
 * @param agentName Agent name for document association
 * @returns Object containing success status and details
 */
export const processExistingDocuments = async (
  clientId: string,
  agentName: string
): Promise<{ success: boolean; processed: number; failed: number; details: any[] }> => {
  try {
    console.log(`Processing existing documents for client ${clientId} with agent ${agentName}`);
    
    // Get documents from the ai_agents table that haven't been processed by LlamaParse yet
    const { data: documents, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("client_id", clientId)
      .eq("interaction_type", "document")
      .is("settings->processing_method", null)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching documents:", error);
      return { 
        success: false, 
        processed: 0, 
        failed: 0, 
        details: [{ error: error.message }] 
      };
    }
    
    console.log(`Found ${documents?.length || 0} documents to process`);
    
    if (!documents || documents.length === 0) {
      return { 
        success: true, 
        processed: 0, 
        failed: 0, 
        details: [{ message: "No documents found that need processing" }] 
      };
    }
    
    // Process each document
    const results = [];
    let processed = 0;
    let failed = 0;
    
    for (const doc of documents) {
      try {
        // Get document URL from the document record
        const documentUrl = doc.url;
        const documentType = doc.type || "application/pdf";
        
        if (!documentUrl) {
          console.warn(`Document ${doc.id} has no URL, skipping`);
          results.push({ 
            id: doc.id, 
            status: "skipped", 
            reason: "No document URL found" 
          });
          failed++;
          continue;
        }
        
        console.log(`Processing document: ${documentUrl}`);
        
        // Submit the document to LlamaParse
        const parseResult = await LlamaCloudService.parseDocument(
          documentUrl,
          documentType,
          clientId,
          agentName
        );
        
        if ('success' in parseResult && !parseResult.success) {
          const errorMsg = 'error' in parseResult ? parseResult.error : 'Unknown error';
          console.error(`Failed to process document ${doc.id}:`, errorMsg);
          results.push({ 
            id: doc.id, 
            url: documentUrl, 
            status: "failed", 
            error: errorMsg 
          });
          failed++;
          continue;
        }
        
        // Update the document with the LlamaParse result
        const updatedDoc = await DocumentProcessingService.processDocument(
          documentUrl,
          documentType,
          clientId,
          agentName
        );
        
        results.push({ 
          id: doc.id, 
          url: documentUrl, 
          status: "processed", 
          result: updatedDoc 
        });
        processed++;
        
        // Add a short delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
        results.push({ 
          id: doc.id, 
          status: "error", 
          error: docError instanceof Error ? docError.message : String(docError) 
        });
        failed++;
      }
    }
    
    // Return the processing results
    return {
      success: true,
      processed,
      failed,
      details: results
    };
  } catch (error) {
    console.error("Error in processExistingDocuments:", error);
    return {
      success: false,
      processed: 0,
      failed: 0,
      details: [{ error: error instanceof Error ? error.message : String(error) }]
    };
  }
};

/**
 * Process a single document with LlamaParse
 * @param documentId Document ID to process
 * @param clientId Client ID
 * @param agentName Agent name
 * @returns Object containing success status and details
 */
export const processDocument = async (
  documentId: string,
  clientId: string, 
  agentName: string
): Promise<{ success: boolean; details: any }> => {
  try {
    // Get the document from ai_agents
    const { data: doc, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("id", documentId)
      .eq("client_id", clientId)
      .single();
    
    if (error || !doc) {
      console.error("Error fetching document:", error);
      return { 
        success: false, 
        details: { error: error?.message || "Document not found" } 
      };
    }
    
    // Get document URL and type
    const documentUrl = doc.url;
    const documentType = doc.type || "application/pdf";
    
    if (!documentUrl) {
      console.warn(`Document ${doc.id} has no URL`);
      return { 
        success: false, 
        details: { error: "No document URL found" } 
      };
    }
    
    console.log(`Processing document: ${documentUrl}`);
    
    // Submit to LlamaParse
    const parseResult = await LlamaCloudService.parseDocument(
      documentUrl,
      documentType,
      clientId,
      agentName
    );
    
    if ('success' in parseResult && !parseResult.success) {
      const errorMsg = 'error' in parseResult ? parseResult.error : 'Unknown error';
      console.error(`Failed to process document ${doc.id}:`, errorMsg);
      return { 
        success: false, 
        details: { error: errorMsg } 
      };
    }
    
    // Process the document with our document processing service
    const processedDoc = await DocumentProcessingService.processDocument(
      documentUrl,
      documentType,
      clientId,
      agentName
    );
    
    return {
      success: true,
      details: processedDoc
    };
  } catch (error) {
    console.error("Error in processDocument:", error);
    return {
      success: false,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};
