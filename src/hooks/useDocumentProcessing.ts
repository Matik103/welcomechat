
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentProcessingResult {
  success: boolean;
  document_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  metadata?: any;
}

export const useDocumentProcessing = (clientId?: string, agentName?: string) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();
  
  // Upload and process document
  const uploadDocument = useMutation({
    mutationFn: async (file: File): Promise<DocumentProcessingResult> => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      if (!agentName) {
        throw new Error('Agent name is required');
      }
      
      try {
        // Reset progress
        setUploadProgress(0);
        
        // Generate a unique file path
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${timestamp}-${file.name.replace(/\s+/g, '-')}`;
        const filePath = `documents/${clientId}/${fileName}`;
        
        // Upload file to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
              setUploadProgress(Math.round((progress.loaded / progress.total) * 50));
            }
          });
        
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          return {
            success: false,
            status: 'failed',
            error: uploadError.message
          };
        }
        
        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('client-documents')
          .getPublicUrl(filePath);
        
        setUploadProgress(60);
        
        // Create document processing job
        const { data: jobData, error: jobError } = await supabase
          .from('document_processing_jobs')
          .insert({
            client_id: clientId,
            agent_name: agentName,
            document_type: fileExt?.toLowerCase() || 'unknown',
            document_url: publicUrl,
            status: 'pending',
            document_id: uploadData?.path,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            processing_method: 'direct_upload',
            metadata: {
              original_name: file.name,
              content_type: file.type,
              size: file.size
            }
          })
          .select('id')
          .single();
        
        if (jobError) {
          console.error('Error creating processing job:', jobError);
          return {
            success: false,
            status: 'failed',
            error: jobError.message
          };
        }
        
        setUploadProgress(75);
        
        // Start processing document by calling processing function
        const { data: processingResult, error: processingError } = await supabase.functions
          .invoke('process-document', {
            body: {
              job_id: jobData.id,
              client_id: clientId,
              agent_name: agentName,
              document_url: publicUrl,
              file_name: file.name,
              file_type: file.type
            }
          });
        
        if (processingError) {
          console.error('Error processing document:', processingError);
          return {
            success: false,
            status: 'failed',
            error: processingError.message
          };
        }
        
        setUploadProgress(100);
        
        // Return success with document ID
        return {
          success: true,
          document_id: uploadData?.path,
          status: 'completed',
          metadata: processingResult
        };
      } catch (error: any) {
        console.error('Unexpected error in document processing:', error);
        return {
          success: false,
          status: 'failed',
          error: error.message || 'Unexpected error occurred'
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-processing'] });
      queryClient.invalidateQueries({ queryKey: ['documents', clientId] });
      toast.success('Document uploaded and processing started');
    },
    onError: (error) => {
      console.error('Error in document processing mutation:', error);
      toast.error('Failed to upload document');
    }
  });

  return {
    uploadDocument,
    uploadProgress,
    isUploading: uploadDocument.isPending,
  };
};
