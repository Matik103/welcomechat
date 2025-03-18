
import { supabase } from "@/integrations/supabase/client";
import { ExtendedActivityType } from "@/types/activity";
import { createClientActivity } from "@/services/clientActivityService";
import { logAgentError } from "@/services/clientActivityService";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

/**
 * Tracks the status of document processing and logs activities
 */
export const trackDocumentProcessing = async (
  clientId: string,
  agentName: string,
  documentId: string,
  status: 'started' | 'completed' | 'failed',
  documentDetails: {
    name: string;
    type?: string;
    size?: number;
    url?: string;
  },
  errorMessage?: string
): Promise<void> => {
  try {
    // Map status to activity type
    const activityTypeMap = {
      'started': 'document_processing_started' as ExtendedActivityType,
      'completed': 'document_processing_completed' as ExtendedActivityType,
      'failed': 'document_processing_failed' as ExtendedActivityType
    };
    
    const activityType = activityTypeMap[status];
    
    // Create appropriate description based on status
    let description = '';
    switch (status) {
      case 'started':
        description = `Started processing document: ${documentDetails.name}`;
        break;
      case 'completed':
        description = `Successfully processed document: ${documentDetails.name}`;
        break;
      case 'failed':
        description = `Failed to process document: ${documentDetails.name}`;
        break;
    }
    
    // Create metadata object
    const metadata = {
      document_id: documentId,
      document_name: documentDetails.name,
      document_type: documentDetails.type || 'unknown',
      document_size: documentDetails.size || 0,
      document_url: documentDetails.url,
      error_message: errorMessage,
      status_updated_at: new Date().toISOString()
    };
    
    // Log activity
    await createClientActivity(
      clientId,
      activityType as any, // Using any here as the new enum values might not be in the type yet
      description,
      metadata
    );
    
    // If status is 'failed', also log to the agent error log
    if (status === 'failed' && errorMessage) {
      await logAgentError(
        clientId,
        agentName,
        'document_processing', 
        errorMessage || 'Unknown error during document processing',
        `Processing document: ${documentDetails.name}`,
        metadata
      );
    }
    
    console.log(`Document processing ${status}: ${documentDetails.name}`);
    
  } catch (error) {
    console.error('Error tracking document processing:', error);
    // Don't rethrow to prevent disruption to the main process
  }
};

/**
 * Uploads a document to Supabase storage and tracks the process
 */
export const uploadDocumentWithTracking = async (
  clientId: string,
  agentName: string,
  file: File,
  documentType: string
): Promise<string | null> => {
  try {
    // Make sure agent name ends with " Assistant"
    const formattedAgentName = agentName.endsWith(' Assistant') 
      ? agentName 
      : `${agentName} Assistant`;
    
    // Generate a unique ID for the document
    const documentId = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    // Start tracking
    await trackDocumentProcessing(
      clientId,
      formattedAgentName,
      documentId,
      'started',
      {
        name: file.name,
        type: file.type,
        size: file.size
      }
    );
    
    // Create a storage path based on client ID and file name
    const filePath = `${clientId}/${documentId}`;
    
    // Upload the file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client_documents')
      .upload(filePath, file);
    
    if (uploadError) {
      await trackDocumentProcessing(
        clientId,
        formattedAgentName,
        documentId,
        'failed',
        {
          name: file.name,
          type: file.type,
          size: file.size
        },
        uploadError.message
      );
      
      toast.error(`Failed to upload document: ${uploadError.message}`);
      return null;
    }
    
    // Get the public URL of the uploaded file
    const { data: urlData } = await supabase.storage
      .from('client_documents')
      .getPublicUrl(filePath);
    
    const fileUrl = urlData.publicUrl;
    
    // Store the document content in the AI agent's knowledge base
    const { data: agentData, error: agentError } = await supabase
      .from("ai_agents")
      .insert({
        client_id: clientId,
        name: formattedAgentName,
        content: `File uploaded: ${file.name}`,
        url: fileUrl,
        interaction_type: "document_upload",
        settings: {
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          document_type: documentType,
          document_id: documentId,
          uploaded_at: new Date().toISOString()
        }
      })
      .select("id")
      .single();
    
    if (agentError) {
      await trackDocumentProcessing(
        clientId,
        formattedAgentName,
        documentId,
        'failed',
        {
          name: file.name,
          type: file.type,
          size: file.size,
          url: fileUrl
        },
        `Failed to store document in knowledge base: ${agentError.message}`
      );
      
      toast.error(`Failed to process document: ${agentError.message}`);
      return null;
    }
    
    // Complete tracking
    await trackDocumentProcessing(
      clientId,
      formattedAgentName,
      documentId,
      'completed',
      {
        name: file.name,
        type: file.type,
        size: file.size,
        url: fileUrl
      }
    );
    
    toast.success(`Document uploaded and processed successfully!`);
    return fileUrl;
    
  } catch (error) {
    console.error("Error uploading document with tracking:", error);
    toast.error(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

/**
 * Updates our document processing pipeline to use the new status tracking
 */
export const migrateDocumentProcessingSystem = async (): Promise<void> => {
  try {
    // Get all document uploads from ai_agents
    const { data: documentUploads, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("interaction_type", "document_upload");
      
    if (error) throw error;
    
    console.log(`Found ${documentUploads?.length || 0} document uploads to process`);
    
    // Process each document to ensure it has the right tracking
    if (documentUploads && documentUploads.length > 0) {
      for (const doc of documentUploads) {
        // Extract file details from settings
        // Fix TypeScript errors by safely accessing settings properties
        const settings = doc.settings as Record<string, any> || {};
        const fileName = settings.file_name as string || 'unknown.file';
        const fileType = settings.file_type as string || 'unknown';
        const fileSize = settings.file_size as number || 0;
        const documentId = settings.document_id as string || `${Date.now()}_migration_${fileName}`;
        
        // Check if we have a completed activity for this document
        // Using a string literal for the metadata path to avoid TypeScript errors
        const { data: existingActivity } = await supabase
          .from("client_activities")
          .select("*")
          .eq("client_id", doc.client_id)
          .eq("metadata->>document_id", documentId)
          .eq("activity_type", "document_processing_completed");
          
        // If we don't have a completed activity, create one
        if (!existingActivity || existingActivity.length === 0) {
          console.log(`Creating completion activity for document: ${fileName}`);
          
          await trackDocumentProcessing(
            doc.client_id,
            doc.name,
            documentId,
            'completed',
            {
              name: fileName,
              type: fileType,
              size: fileSize,
              url: doc.url || undefined
            }
          );
        }
      }
    }
    
    console.log('Document processing migration completed successfully');
  } catch (error) {
    console.error('Error migrating document processing system:', error);
  }
};

/**
 * Gets a list of documents for a specific client and agent
 */
export const getClientDocuments = async (
  clientId: string,
  agentName?: string
): Promise<{
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: string;
  status: 'processing' | 'completed' | 'failed';
}[]> => {
  try {
    // Format the agent name if provided
    let formattedAgentName: string | undefined = undefined;
    if (agentName) {
      formattedAgentName = agentName.endsWith(' Assistant') 
        ? agentName 
        : `${agentName} Assistant`;
    }
    
    // Query the ai_agents table for document uploads
    let query = supabase
      .from("ai_agents")
      .select("*")
      .eq("client_id", clientId)
      .eq("interaction_type", "document_upload");
      
    // Add agent name filter if provided
    if (formattedAgentName) {
      query = query.eq("name", formattedAgentName);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform the data
    const documents = (data || []).map(doc => {
      // Fix TypeScript errors by safely accessing settings properties
      const settings = doc.settings as Record<string, any> || {};
      return {
        id: doc.id,
        name: settings.file_name as string || 'Unknown file',
        type: settings.file_type as string || 'unknown',
        size: settings.file_size as number || 0,
        url: doc.url || '',
        uploadDate: doc.created_at || new Date().toISOString(),
        status: 'completed' as 'processing' | 'completed' | 'failed'
      };
    });
    
    // Get the status of each document from client_activities
    for (const doc of documents) {
      // See if we have a failed status
      // Using a string literal for the metadata path to avoid TypeScript errors
      const { data: failedActivity } = await supabase
        .from("client_activities")
        .select("*")
        .eq("client_id", clientId)
        .eq("metadata->>document_name", doc.name)
        .eq("activity_type", "document_processing_failed")
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (failedActivity && failedActivity.length > 0) {
        doc.status = 'failed';
        continue;
      }
      
      // See if we have a processing status with no completion
      const { data: processingActivity } = await supabase
        .from("client_activities")
        .select("*")
        .eq("client_id", clientId)
        .eq("metadata->>document_name", doc.name)
        .eq("activity_type", "document_processing_started")
        .order('created_at', { ascending: false })
        .limit(1);
        
      const { data: completedActivity } = await supabase
        .from("client_activities")
        .select("*")
        .eq("client_id", clientId)
        .eq("metadata->>document_name", doc.name)
        .eq("activity_type", "document_processing_completed")
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (processingActivity && processingActivity.length > 0) {
        if (!completedActivity || completedActivity.length === 0) {
          doc.status = 'processing';
        }
      }
    }
    
    return documents;
  } catch (error) {
    console.error('Error fetching client documents:', error);
    return [];
  }
};

// Export a function to update our scripts
export const updateDocumentScripts = async (): Promise<void> => {
  console.log('Updating document processing scripts');
  
  // Run the migration to update document status tracking
  await migrateDocumentProcessingSystem();
};
