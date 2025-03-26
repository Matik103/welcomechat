
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingResult } from '@/types/document-processing';

export function useDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<Error | null>(null);
  
  const uploadDocument = async (file: File): Promise<DocumentProcessingResult> => {
    if (!clientId) {
      throw new Error('Client ID is required to upload documents');
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      // Generate a unique file path
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const filePath = `documents/${clientId}/${timestamp}-${file.name}`;
      
      // Mock upload progress since onUploadProgress is not available
      const startProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress >= 95) {
            clearInterval(interval);
            progress = 95;
          }
          setUploadProgress(progress);
        }, 300);
        
        return () => clearInterval(interval);
      };
      
      const stopProgress = startProgress();
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      setUploadProgress(95);
      
      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('client-documents')
        .getPublicUrl(filePath);
      
      const fileUrl = publicUrlData.publicUrl;
      
      // Create a document processing record
      const documentType = fileExt || 'unknown';
      
      const { data: documentData, error: documentError } = await supabase
        .from('document_processing')
        .insert({
          document_url: fileUrl,
          client_id: clientId,
          agent_name: 'AI Assistant',
          document_type: documentType,
          status: 'pending',
          started_at: new Date().toISOString(),
          metadata: {
            original_filename: file.name,
            file_size: file.size,
            content_type: file.type
          }
        })
        .select('id')
        .single();
      
      if (documentError) {
        throw documentError;
      }
      
      stopProgress();
      setUploadProgress(100);
      
      toast.success('Document uploaded successfully');
      
      return {
        success: true,
        documentId: documentData.id.toString(),
        processed: 0,
        failed: 0,
        status: 'pending',
        message: 'Document uploaded and queued for processing'
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadError(error as Error);
      toast.error('Failed to upload document');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processed: 0,
        failed: 1
      };
    } finally {
      setIsUploading(false);
    }
  };
  
  return {
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadError
  };
}
