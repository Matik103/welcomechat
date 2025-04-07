
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { RAPIDAPI_KEY, IS_PRODUCTION } from '@/config/env';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export function useUnifiedDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Create a mutation for document upload
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<{ success: boolean; message: string; url?: string }> => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      setIsUploading(true);
      setProgress(0);

      try {
        const file = formData.get('file') as File;
        
        // Validation
        if (!file) {
          throw new Error('No file provided');
        }
        
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(`File type ${file.type} not supported. Please upload PDF, TXT, DOC or DOCX files.`);
        }
        
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        }

        // Generate a unique file path
        const timestamp = Date.now();
        const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `documents/${clientId}/${timestamp}_${fileName}`;

        // Show initial progress
        setProgress(10);
        
        // 1. Upload file to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Error uploading file: ${uploadError.message}`);
        }

        setProgress(30);

        // 2. Get public URL
        const { data: publicUrlData } = await supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
          throw new Error('Failed to get public URL for uploaded file');
        }

        const documentUrl = publicUrlData.publicUrl;
        
        setProgress(50);

        // 3. Create document entry and trigger processing
        const { data: documentData, error: documentError } = await supabase
          .from('document_processing_jobs')
          .insert([{
            client_id: clientId,
            agent_name: 'Default Agent', // This will be updated if needed
            document_type: file.type,
            document_url: documentUrl,
            document_id: filePath,
            status: 'pending',
            processing_method: 'supabase_edge',
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              uploadedAt: new Date().toISOString()
            }
          }])
          .select()
          .single();

        if (documentError) {
          throw new Error(`Error creating document entry: ${documentError.message}`);
        }

        setProgress(80);

        // 4. Trigger document processing via Edge Function
        try {
          const processingResponse = await fetch('/api/process-document', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': RAPIDAPI_KEY || '',
            },
            body: JSON.stringify({
              documentId: documentData.id,
              clientId,
              documentUrl,
              filePath
            }),
          });

          if (!processingResponse.ok) {
            console.warn('Document processing trigger failed, will retry automatically:', 
              await processingResponse.text());
          }

          setProgress(100);
          
          return {
            success: true,
            message: 'Document uploaded successfully and processing has started.',
            url: documentUrl
          };
        } catch (processingError) {
          console.error('Error triggering document processing:', processingError);
          // We continue because the document is uploaded and processing can be retried
          return {
            success: true,
            message: 'Document uploaded successfully but processing could not be started. It will be processed automatically later.',
            url: documentUrl
          };
        }
      } catch (error) {
        console.error('Document upload error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred during document upload'
        };
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: Error) => {
      console.error('Document upload mutation error:', error);
      toast.error(`Failed to upload document: ${error.message}`);
      setIsUploading(false);
    }
  });

  // Return values and methods
  return {
    uploadDocument: (formData: FormData) => uploadMutation.mutate(formData),
    isUploading,
    progress,
    isError: uploadMutation.isError,
    error: uploadMutation.error,
    reset: uploadMutation.reset
  };
}
