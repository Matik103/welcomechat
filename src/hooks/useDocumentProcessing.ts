
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingService, uploadDocument } from '@/services/documentProcessingService';
import { toast } from 'sonner';

export function useDocumentProcessing(clientId?: string) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Query for fetching document processing jobs
  const { data: processingJobs, isLoading, refetch } = useQuery({
    queryKey: ['documentProcessingJobs', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('document_processing_jobs')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching document processing jobs:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!clientId
  });

  // Mutation for uploading and processing a document
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      try {
        // Simulate upload progress
        const simulateProgress = () => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 95) {
              progress = 95; // Don't reach 100% until actually done
              clearInterval(interval);
            }
            setUploadProgress(Math.round(progress));
          }, 300);
          
          return () => clearInterval(interval);
        };
        
        const clearProgressSimulation = simulateProgress();
        
        // Upload the document
        const jobId = await uploadDocument(file, clientId);
        setProcessingId(jobId);
        
        // Clear progress simulation
        clearProgressSimulation();
        setUploadProgress(100);
        
        return jobId;
      } catch (error) {
        console.error('Error uploading document:', error);
        toast.error('Failed to upload document');
        throw error;
      }
    },
    onSuccess: () => {
      refetch();
      toast.success('Document uploaded successfully and queued for processing');
    },
    onError: (error) => {
      console.error('Document upload mutation error:', error);
      toast.error('Failed to upload and process document');
    }
  });

  // Function to check the status of a document processing job
  const checkStatus = async (jobId: string) => {
    try {
      return await DocumentProcessingService.checkStatus(jobId);
    } catch (error) {
      console.error('Error checking document status:', error);
      throw error;
    }
  };

  return {
    processingJobs: processingJobs || [],
    isLoading,
    uploadDocument: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    processingId,
    checkStatus,
    refetch
  };
}
