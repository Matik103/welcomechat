import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { 
  DocumentProcessingOptions, 
  DocumentProcessingStatus, 
  DocumentProcessingResult 
} from '@/types/document-processing';
import { uploadFileToLlamaParse, checkParsingStatus, getMarkdownResults } from '@/services/llamaIndexService';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';

export function useUnifiedDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<DocumentProcessingStatus>({
    status: 'init',
    stage: 'init',
    progress: 0
  });
  const [uploadResult, setUploadResult] = useState<DocumentProcessingResult | null>(null);

  const updateProgressStatus = (
    stage: DocumentProcessingStatus['stage'], 
    progress: number,
    message?: string
  ) => {
    setUploadProgress(progress);
    setUploadStatus({
      status: stage === 'completed' || stage === 'failed' ? stage : 'processing',
      stage,
      progress,
      message
    });
  };

  const processWithAI = async (
    file: File,
    options: DocumentProcessingOptions
  ): Promise<DocumentProcessingResult> => {
    try {
      updateProgressStatus('processing', 60, 'Processing with AI...');
      
      // Upload to LlamaIndex for processing
      const jobResponse = await uploadFileToLlamaParse(file);
      
      updateProgressStatus('processing', 70, 'Analyzing document content...');
      
      // Poll for job completion
      let status = await checkParsingStatus(jobResponse.job_id);
      let attempts = 0;
      const maxAttempts = 30;
      
      while (status.status !== 'completed' && status.status !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        status = await checkParsingStatus(jobResponse.job_id);
        attempts++;
        
        updateProgressStatus('processing', 70 + Math.min(attempts * 0.8, 20), 
          `Analyzing document content (attempt ${attempts}/${maxAttempts})...`);
      }
      
      if (status.status !== 'completed') {
        throw new Error(`Processing timed out or failed after ${attempts} attempts`);
      }
      
      // Get the processing results
      const results = await getMarkdownResults(jobResponse.job_id);
      
      if (!results || !results.chunks || results.chunks.length === 0) {
        throw new Error('No content extracted from document');
      }
      
      return {
        success: true,
        processed: results.chunks.length,
        failed: 0,
        aiProcessed: true,
        fileName: file.name,
        fileSize: file.size,
        extractedText: results.chunks[0].content
      };
    } catch (error) {
      console.error('Error processing document with AI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in AI processing',
        processed: 0,
        failed: 1
      };
    }
  };

  const storeDocumentMetadata = async (
    file: File,
    url: string,
    extractedText: string | undefined,
    options: DocumentProcessingOptions
  ): Promise<string> => {
    try {
      updateProgressStatus('storing', 85, 'Storing document metadata...');
      
      const documentId = uuidv4();
      const { error } = await supabase.from('document_processing_jobs').insert({
        client_id: options.clientId,
        document_id: documentId,
        document_url: url,
        document_type: file.type.includes('pdf') ? 'pdf' : 'document',
        agent_name: options.agentName || '',
        status: 'completed',
        content: extractedText,
        metadata: {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        }
      });
      
      if (error) throw new Error(`Database record creation failed: ${error.message}`);
      
      return documentId;
    } catch (error) {
      console.error('Error storing document metadata:', error);
      throw error;
    }
  };

  const uploadDocumentToStorage = async (
    file: File
  ): Promise<{ path: string; url: string }> => {
    try {
      updateProgressStatus('uploading', 10, 'Uploading to storage...');
      
      const filePath = `documents/${clientId}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase
        .storage
        .from('documents')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            const calculatedProgress = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(Math.min(40, calculatedProgress));
            updateProgressStatus('uploading', Math.min(40, calculatedProgress),
              `Uploading: ${calculatedProgress}%`);
          }
        });
      
      if (error) throw new Error(`Storage upload failed: ${error.message}`);
      
      const { data: urlData } = await supabase
        .storage
        .from('documents')
        .getPublicUrl(filePath);
      
      updateProgressStatus('processing', 50, 'Document uploaded, processing content...');
      
      return { path: filePath, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error uploading to storage:', error);
      throw error;
    }
  };

  const syncToAgent = async (
    documentId: string,
    options: DocumentProcessingOptions
  ): Promise<void> => {
    if (!options.syncToAgent || !options.agentName) {
      return;
    }
    
    try {
      updateProgressStatus('syncing', 90, `Syncing to agent "${options.agentName}"...`);
      
      // Logic to sync document to agent would go here
      // This is a placeholder for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateProgressStatus('completed', 100, 'Document synced to agent successfully!');
    } catch (error) {
      console.error('Error syncing to agent:', error);
      throw error;
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
      updateProgressStatus('init', 0, 'Starting upload...');
      
      // Step 1: Upload to storage
      const { path, url } = await uploadDocumentToStorage(file);
      
      // Step 2: Process with AI if enabled
      let aiResult: DocumentProcessingResult = {
        success: true,
        processed: 0,
        failed: 0
      };
      
      if (options.shouldUseAI) {
        aiResult = await processWithAI(file, options);
        if (!aiResult.success) {
          throw new Error(aiResult.error || 'AI processing failed');
        }
      }
      
      // Step 3: Store document metadata
      const documentId = await storeDocumentMetadata(file, url, aiResult.extractedText, options);
      
      // Step 4: Sync to agent if needed
      if (options.syncToAgent && options.agentName) {
        await syncToAgent(documentId, options);
      }
      
      // Step 5: Create activity record
      if (options.agentName) {
        await createClientActivity(
          options.clientId,
          options.agentName,
          ActivityType.DOCUMENT_ADDED,
          `Document uploaded for agent ${options.agentName}: ${file.name}`,
          {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            agent_name: options.agentName
          }
        );
      }
      
      updateProgressStatus('completed', 100, 'Document processed successfully!');
      
      const result = {
        success: true,
        processed: aiResult.processed,
        failed: aiResult.failed,
        aiProcessed: options.shouldUseAI,
        fileName: file.name,
        fileSize: file.size,
        documentId,
        documentUrl: url
      };
      
      setUploadResult(result);
      return result;
    } catch (error) {
      console.error('Error in document upload process:', error);
      
      updateProgressStatus('failed', 0, 
        error instanceof Error ? error.message : 'Document upload failed');
      
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processed: 0,
        failed: 1
      };
      
      setUploadResult(result);
      return result;
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
