
import { useState } from 'react';
import { DocumentProcessingOptions, DocumentProcessingResult, DocumentProcessingStatus } from '@/types/document-processing';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { uploadDocumentToLlamaIndex, processLlamaIndexJob } from '@/services/llamaIndexService';
import { useDocumentUpload } from './useDocumentUpload';
import { useDocumentUrlProcessing } from './useDocumentUrlProcessing';

export function useUnifiedDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<DocumentProcessingStatus>({
    status: 'pending',
    stage: 'init',
    progress: 0
  });
  const [uploadResult, setUploadResult] = useState<DocumentProcessingResult | null>(null);
  
  // Initialize the lower-level hooks
  const documentUpload = useDocumentUpload(clientId);
  const documentUrlProcessing = useDocumentUrlProcessing(clientId);

  const updateUploadProgress = (progress: number, status: string) => {
    setUploadProgress(progress);
    setUploadStatus({
      status: 'processing',
      stage: 'processing',
      progress,
      message: status
    });
  };

  const syncToAgent = async (
    documentId: string, 
    content: string, 
    agentName: string, 
    clientId: string
  ): Promise<boolean> => {
    try {
      console.log(`Syncing document ${documentId} to agent ${agentName}`);
      
      // Check if agent table exists
      const sanitizedAgentName = agentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const agentTableName = `agent_${sanitizedAgentName}`;
      
      // Create a chunk entry in the agent's table
      const { error } = await supabase.from('ai_agents').insert({
        content,
        metadata: {
          document_id: documentId,
          source_type: 'document',
          sync_date: new Date().toISOString()
        },
        client_id: clientId,
        name: agentName
      });
      
      if (error) {
        console.error(`Error syncing to agent: ${error.message}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in syncToAgent:', error);
      return false;
    }
  };

  const uploadDocument = async (
    file: File, 
    options: DocumentProcessingOptions
  ): Promise<DocumentProcessingResult> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadResult(null);
      
      const documentResult = await documentUpload.uploadDocument(file, options.agentName);
      
      // Update our progress
      setUploadProgress(documentResult.success ? 70 : 0);
      setUploadStatus(documentResult.success ? {
        status: 'processing',
        stage: 'syncing',
        progress: 70,
        message: 'Processing document content...'
      } : {
        status: 'failed',
        stage: 'failed',
        progress: 0,
        message: documentResult.error || 'Document processing failed'
      });
      
      // If requested, sync to the agent
      if (documentResult.success && options.syncToAgent && options.agentName && documentResult.extractedText) {
        updateUploadProgress(80, 'Syncing with AI Assistant...');
        
        await syncToAgent(
          documentResult.documentId || uuidv4(),
          documentResult.extractedText,
          options.agentName,
          options.clientId
        );
        
        updateUploadProgress(90, 'Finalizing document processing...');
      }
      
      // Return result with sync information
      const result: DocumentProcessingResult = {
        ...documentResult,
        success: documentResult.success,
        processed: documentResult.processed || 0,
        failed: documentResult.failed || 0
      };
      
      setUploadResult(result);
      setUploadProgress(100);
      setUploadStatus({
        status: result.success ? 'completed' : 'failed',
        stage: result.success ? 'completed' : 'failed',
        progress: result.success ? 100 : 0,
        message: result.success ? 'Document processed successfully!' : (result.error || 'Document processing failed')
      });
      
      return result;
    } catch (error) {
      console.error('Error in unified document upload:', error);
      
      const errorResult: DocumentProcessingResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in document processing',
        processed: 0,
        failed: 1
      };
      
      setUploadResult(errorResult);
      setUploadStatus({
        status: 'failed',
        stage: 'failed',
        progress: 0,
        message: errorResult.error
      });
      
      return errorResult;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadStatus,
    uploadResult
  };
}
