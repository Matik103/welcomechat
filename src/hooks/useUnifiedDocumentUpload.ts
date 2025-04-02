
import { useState } from 'react';
import { DocumentProcessingResult } from '@/types/document-processing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';
import { useLlamaIndexProcessing } from './useLlamaIndexProcessing';
import { v4 as uuidv4 } from 'uuid';

interface DocumentUploadOptions {
  syncToAgent?: boolean;
  syncToProfile?: boolean;
  syncToWidgetSettings?: boolean;
  activityMessage?: string;
}

export function useUnifiedDocumentUpload(clientId: string, agentName?: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<DocumentProcessingResult | null>(null);
  const { processDocument, progress } = useLlamaIndexProcessing(clientId);

  const uploadDocument = async (file: File, options: DocumentUploadOptions = {}): Promise<DocumentProcessingResult> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    const {
      syncToAgent = true, 
      syncToProfile = true, 
      syncToWidgetSettings = true,
      activityMessage
    } = options;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // First, get the agent name if not provided
      let effectiveAgentName = agentName;
      
      if (!effectiveAgentName) {
        const { data: agentData, error: agentError } = await supabase
          .from('ai_agents')
          .select('name')
          .eq('client_id', clientId)
          .eq('interaction_type', 'config')
          .limit(1)
          .maybeSingle();
        
        if (agentError) {
          console.error('Failed to get agent name:', agentError);
          throw new Error(`Failed to get agent name: ${agentError.message}`);
        }
        
        if (!agentData || !agentData.name) {
          throw new Error('Agent name not found for this client');
        }
        
        effectiveAgentName = agentData.name;
      }
      
      console.log("Using agent name for document upload:", effectiveAgentName);
      
      // Update progress based on LlamaIndex processing progress
      const progressInterval = setInterval(() => {
        setUploadProgress(progress);
      }, 200);
      
      console.log("Starting LlamaIndex document processing for file:", file.name);
      
      try {
        // Process the document with LlamaIndex
        const result = await processDocument(file, effectiveAgentName);
        
        console.log("LlamaIndex processing result:", result);
        
        // Clear the interval and set final progress
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        if (result.success) {
          // If document was successfully processed, handle synchronization

          // 1. Sync to ai_agents for this client if requested
          if (syncToAgent && result.documentId) {
            try {
              console.log("Syncing document to AI agent");
              await syncDocumentToAgent(clientId, effectiveAgentName, result, file);
            } catch (syncError) {
              console.error("Error syncing document to agent:", syncError);
              // Non-fatal error, continue with other operations
            }
          }

          // 2. Sync to client profile if requested
          if (syncToProfile && result.documentId) {
            try {
              console.log("Syncing document to client profile");
              await syncDocumentToClientProfile(clientId, result, file);
            } catch (syncError) {
              console.error("Error syncing document to client profile:", syncError);
              // Non-fatal error, continue with other operations
            }
          }

          // 3. Sync to widget settings if requested
          if (syncToWidgetSettings && result.documentId) {
            try {
              console.log("Syncing document to widget settings");
              await syncDocumentToWidgetSettings(clientId, result, file);
            } catch (syncError) {
              console.error("Error syncing document to widget settings:", syncError);
              // Non-fatal error, continue with other operations
            }
          }
          
          // Create client activity with enum type
          await createClientActivity(
            clientId,
            effectiveAgentName,
            ActivityType.DOCUMENT_ADDED,
            activityMessage || `Document uploaded and processed: ${file.name}`,
            {
              file_name: file.name,
              file_size: file.size,
              file_type: file.type,
              processed_sections: result.processed,
              failed_sections: result.failed,
              processed_with: 'llamaindex',
              document_id: result.documentId
            }
          );
          
          setUploadResult(result);
          toast.success('Document uploaded and processed successfully');
          
          return result;
        } else {
          console.error("Document processing failed:", result.error);
          setUploadResult({
            success: false,
            error: result.error || 'Failed to process document',
            processed: 0,
            failed: 1,
            documentId: result.documentId
          });
          throw new Error(result.error || 'Failed to process document');
        }
      } catch (processingError) {
        console.error("Error in document processing:", processingError);
        clearInterval(progressInterval);
        setUploadProgress(100);  // Set to 100 to indicate processing is complete, even if failed
        
        const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error';
        const result = {
          success: false,
          error: errorMessage,
          processed: 0,
          failed: 1,
          documentId: uuidv4() // Generate a new document ID for the error case
        };
        
        setUploadResult(result);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error uploading document: ${errorMessage}`);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to sync document to AI agent
  const syncDocumentToAgent = async (
    clientId: string, 
    agentName: string, 
    result: DocumentProcessingResult, 
    file: File
  ) => {
    if (!result.documentId || !result.extractedText) {
      console.log("No document ID or extracted text to sync to agent");
      return;
    }
    
    // Update or insert document content in ai_agents table
    const { error } = await supabase
      .from('ai_agents')
      .upsert({
        client_id: clientId,
        name: `Document: ${file.name}`,
        content: result.extractedText,
        type: 'document',
        interaction_type: 'document',
        metadata: {
          document_id: result.documentId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          processed_sections: result.processed,
          failed_sections: result.failed,
          processed_with: 'llamaindex',
          primary_agent: agentName
        }
      });
      
    if (error) {
      console.error("Error syncing document to agent:", error);
      throw error;
    }
  };
  
  // Helper function to sync document to client profile
  const syncDocumentToClientProfile = async (
    clientId: string, 
    result: DocumentProcessingResult, 
    file: File
  ) => {
    if (!result.documentId) {
      console.log("No document ID to sync to client profile");
      return;
    }
    
    // Update client record
    const { error } = await supabase
      .from('clients')
      .update({
        document_ids: supabase.sql`array_append(coalesce(document_ids, '{}'), ${result.documentId})`,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);
      
    if (error) {
      console.error("Error syncing document to client profile:", error);
      throw error;
    }
  };
  
  // Helper function to sync document to widget settings
  const syncDocumentToWidgetSettings = async (
    clientId: string, 
    result: DocumentProcessingResult, 
    file: File
  ) => {
    if (!result.documentId) {
      console.log("No document ID to sync to widget settings");
      return;
    }
    
    // Get current widget settings
    const { data: widgetData, error: widgetError } = await supabase
      .from('widget_settings')
      .select('settings')
      .eq('client_id', clientId)
      .maybeSingle();
      
    if (widgetError) {
      console.error("Error getting widget settings:", widgetError);
      throw widgetError;
    }
    
    // Current settings or empty object
    const currentSettings = widgetData?.settings || {};
    
    // Add document to settings
    const updatedSettings = {
      ...currentSettings,
      documents: [
        ...(currentSettings.documents || []),
        {
          id: result.documentId,
          name: file.name,
          type: file.type,
          size: file.size,
          processed_sections: result.processed,
          failed_sections: result.failed
        }
      ]
    };
    
    // Update widget settings
    const { error: updateError } = await supabase
      .from('widget_settings')
      .upsert({
        client_id: clientId,
        settings: updatedSettings
      });
      
    if (updateError) {
      console.error("Error updating widget settings:", updateError);
      throw updateError;
    }
  };

  return {
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadResult
  };
}
