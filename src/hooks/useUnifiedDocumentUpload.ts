
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { IS_PRODUCTION } from '@/config/env';

// Define and export the upload result type
export interface UploadResult {
  success: boolean;
  data?: any;
  error?: any;
  message?: string;
  fileName?: string;
  documentId?: string | number;
  publicUrl?: string;
}

export function useUnifiedDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);

  // Upload document function
  const uploadDocument = useCallback(async (formData: FormData): Promise<UploadResult> => {
    if (!clientId) {
      const error = new Error('Client ID is required');
      setError(error);
      return { success: false, error, message: 'Client ID is required' };
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Get file from FormData
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Generate a unique file name
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const filePath = `documents/${clientId}/${timestamp}-${file.name}`;

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

      // Get public URL for the uploaded file
      const { data: urlData } = await supabase.storage
        .from('client-documents')
        .getPublicUrl(filePath);

      const documentUrl = urlData?.publicUrl;

      // Store document reference in the database
      const { data: docData, error: docError } = await supabase
        .from('document_links')
        .insert([{
          client_id: clientId,
          document_url: documentUrl,
          document_type: fileExt || 'unknown',
          status: 'uploaded'
        }])
        .select()
        .single();

      if (docError) {
        throw docError;
      }

      // Clean up progress interval
      clearInterval(progressInterval);
      setProgress(100);
      
      // Return success result
      return { 
        success: true, 
        data: { document: docData, url: documentUrl },
        message: 'Document uploaded successfully',
        fileName: file.name,
        documentId: docData?.id,
        publicUrl: documentUrl
      };
    } catch (err: any) {
      console.error('Document upload error:', err);
      setError(err);
      
      // Return error result
      return { 
        success: false, 
        error: err.message || 'Failed to upload document',
        message: err.message || 'Failed to upload document'
      };
    } finally {
      // Small delay before resetting isUploading to allow progress animation to complete
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
    }
  }, [clientId]);

  // Function to handle success
  const handleSuccess = useCallback((result: UploadResult) => {
    if (result.success) {
      toast.success(result.message || 'Document uploaded successfully');
      return true;
    }
    return false;
  }, []);

  // Function to handle error
  const handleError = useCallback((result: UploadResult) => {
    if (!result.success) {
      toast.error(result.message || 'Upload failed');
      return true;
    }
    return false;
  }, []);

  return {
    uploadDocument,
    isUploading,
    progress,
    error,
    handleSuccess,
    handleError
  };
}
