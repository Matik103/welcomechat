
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Upload document function
export async function uploadDocumentFunction(file: File, clientId: string): Promise<string> {
  // Upload implementation...
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const filePath = `documents/${clientId}/${timestamp}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('client-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw error;
  }
  
  const { data: urlData } = supabase.storage
    .from('client-documents')
    .getPublicUrl(filePath);
  
  // Create document processing record
  const { data: jobData, error: jobError } = await supabase
    .from('document_processing')
    .insert({
      document_url: urlData.publicUrl,
      client_id: clientId,
      agent_name: 'AI Assistant',
      document_type: fileExt || 'unknown',
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
  
  if (jobError) {
    throw jobError;
  }
  
  return jobData.id.toString();
}

// Check document processing status
export async function checkDocumentStatus(documentId: string): Promise<'pending' | 'processing' | 'completed' | 'failed'> {
  try {
    const { data, error } = await supabase
      .from('document_processing')
      .select('status')
      .eq('id', parseInt(documentId, 10))
      .single();
    
    if (error) throw error;
    
    return data.status as 'pending' | 'processing' | 'completed' | 'failed';
  } catch (error) {
    console.error('Error checking document status:', error);
    return 'failed';
  }
}

export function useDocumentProcessing(clientId?: string) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Query for fetching document processing jobs
  const { data: processingJobs, isLoading, refetch } = useQuery({
    queryKey: ['documentProcessingJobs', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('document_processing')
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
        const jobId = await uploadDocumentFunction(file, clientId);
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

  return {
    processingJobs: processingJobs || [],
    isLoading,
    uploadDocument: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    processingId,
    checkStatus: checkDocumentStatus,
    refetch
  };
}
