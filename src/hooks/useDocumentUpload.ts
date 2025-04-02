
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { DocumentProcessingStatus, DocumentProcessingResult } from '@/types/document-processing';
import { uploadDocumentToLlamaIndex, processLlamaIndexJob } from '@/services/llamaIndexService';

export function useDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<DocumentProcessingStatus>({
    status: 'pending',
    stage: 'init',
    progress: 0
  });
  const [uploadResult, setUploadResult] = useState<DocumentProcessingResult | null>(null);

  const uploadDocumentToStorage = async (file: File): Promise<{ path: string; url: string }> => {
    try {
      setUploadStatus({
        status: 'processing',
        stage: 'uploading',
        progress: 10,
        message: 'Uploading to storage...'
      });

      const filePath = `documents/${clientId}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase
        .storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw new Error(`Storage upload failed: ${error.message}`);
      
      // Update progress after upload completes
      setUploadProgress(50);
      setUploadStatus({
        status: 'processing',
        stage: 'processing',
        progress: 50,
        message: 'Upload complete, processing...'
      });
      
      const { data: urlData } = await supabase
        .storage
        .from('documents')
        .getPublicUrl(filePath);
      
      return { path: filePath, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error uploading to storage:', error);
      throw error;
    }
  };

  const processWithAI = async (file: File, agentName?: string): Promise<DocumentProcessingResult> => {
    try {
      setUploadStatus({
        status: 'processing',
        stage: 'processing',
        progress: 60,
        message: 'Processing with AI...'
      });
      
      // Upload to LlamaIndex for processing
      const jobResponse = await uploadDocumentToLlamaIndex(file, {});
      
      setUploadStatus({
        status: 'processing',
        stage: 'analyzing',
        progress: 70,
        message: 'Analyzing document contents...'
      });
      
      // Poll for job completion (simplified for now)
      const result = await processLlamaIndexJob(jobResponse.job_id);
      
      if (result.status === 'SUCCEEDED') {
        return {
          success: true,
          processed: 1,
          failed: 0,
          aiProcessed: true,
          fileName: file.name,
          fileSize: file.size,
          extractedText: result.parsed_content || ''
        };
      } else {
        return {
          success: false,
          error: 'AI processing failed',
          processed: 0,
          failed: 1
        };
      }
    } catch (error) {
      console.error('Error processing with AI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in AI processing',
        processed: 0,
        failed: 1
      };
    }
  };

  const uploadDocument = async (file: File, agentName?: string): Promise<DocumentProcessingResult> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadResult(null);
      setUploadStatus({
        status: 'pending',
        stage: 'init',
        progress: 0,
        message: 'Starting upload...'
      });
      
      // Step 1: Upload to storage
      const { path, url } = await uploadDocumentToStorage(file);
      
      setUploadStatus({
        status: 'processing',
        stage: 'processing',
        progress: 50,
        message: 'Document uploaded, processing content...'
      });
      
      // Step 2: Process with AI
      const aiResult = await processWithAI(file, agentName);
      
      // Step 3: Create document record in database
      const documentId = uuidv4();
      const { error } = await supabase.from('document_processing_jobs').insert({
        client_id: clientId,
        document_id: documentId,
        document_url: url,
        document_type: file.type.includes('pdf') ? 'pdf' : 'document',
        agent_name: agentName || '',
        status: aiResult.success ? 'completed' : 'failed',
        error: aiResult.error,
        content: aiResult.extractedText,
        metadata: {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: path
        }
      });
      
      if (error) throw new Error(`Database record creation failed: ${error.message}`);
      
      setUploadStatus({
        status: 'completed',
        stage: 'completed',
        progress: 100,
        message: 'Document processed successfully!'
      });
      
      const result = {
        success: true,
        processed: aiResult.processed,
        failed: aiResult.failed,
        aiProcessed: aiResult.aiProcessed,
        fileName: file.name,
        fileSize: file.size,
        documentId,
        documentUrl: url
      };
      
      setUploadResult(result);
      return result;
    } catch (error) {
      console.error('Error in document upload process:', error);
      
      setUploadStatus({
        status: 'failed',
        stage: 'failed',
        progress: 0,
        message: error instanceof Error ? error.message : 'Document upload failed'
      });
      
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
