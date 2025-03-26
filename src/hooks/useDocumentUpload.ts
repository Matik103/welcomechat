
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadDocument = async (file: File) => {
    if (!clientId) {
      toast.error('Client ID is required for document upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `documents/${clientId}/${fileName}`;
      
      // Check if storage bucket exists, create if needed
      const { data: buckets } = await supabase.storage.listBuckets();
      const documentsBucket = buckets?.find(b => b.name === 'documents');
      
      if (!documentsBucket) {
        // Create bucket (this requires admin privileges)
        await supabase.storage.createBucket('documents', {
          public: false,
          fileSizeLimit: 52428800 // 50MB
        });
      }
      
      // Upload file to storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onProgress: ({ percent }) => {
            console.log('Upload progress:', percent);
            setUploadProgress(percent);
          }
        });
      
      if (error) {
        throw error;
      }
      
      // Get public URL for the file
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      // Create a record in document_processing_jobs table
      const { data: jobData, error: jobError } = await supabase
        .from('document_processing_jobs')
        .insert({
          client_id: clientId,
          document_url: urlData.publicUrl,
          document_type: file.type || 'document',
          document_id: filePath,
          agent_name: 'AI Assistant',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            originalFileName: file.name,
            fileSize: file.size,
            mimeType: file.type
          }
        })
        .select()
        .single();
      
      if (jobError) {
        throw jobError;
      }
      
      toast.success('Document uploaded successfully and queued for processing');
      return jobData;
      
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadDocument,
    isUploading,
    uploadProgress
  };
}
