
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { createClientActivity } from '@/services/clientActivityService';

export function useDocumentUpload(clientId?: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadDocument = async (file: File): Promise<void> => {
    if (!clientId) {
      toast.error('Client ID is required to upload documents');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `documents/${clientId}/${fileName}`;
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL for the uploaded file
      const { data: urlData } = await supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded document');
      }
      
      // Create a record in the document_links table
      const { data: documentData, error: documentError } = await supabase
        .from('document_links')
        .insert({
          client_id: clientId,
          link: urlData.publicUrl,
          document_type: 'uploaded',
          refresh_rate: 30, // Default refresh rate in days
        })
        .select()
        .single();
      
      if (documentError) {
        throw documentError;
      }
      
      // Log activity
      await createClientActivity(
        clientId,
        'document_uploaded',
        `Document uploaded: ${file.name}`,
        { 
          file_name: file.name, 
          file_type: file.type,
          file_size: file.size,
          document_id: documentData.id,
          storage_path: filePath
        }
      );
      
      toast.success('Document uploaded successfully');
      
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
