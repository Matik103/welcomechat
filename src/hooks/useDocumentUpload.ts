
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface UploadResult {
  success: boolean;
  filePath?: string;
  fileUrl?: string;
  error?: string;
}

export function useDocumentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (
    file: File,
    clientId: string,
    documentType: string = 'file'
  ): Promise<UploadResult> => {
    if (!file || !clientId) {
      return {
        success: false,
        error: 'Missing file or client ID'
      };
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `clients/${clientId}/documents/${fileName}`;

      // Upload file to storage
      const { data, error } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        throw error;
      }

      setProgress(100);

      // Get the public URL for the file
      const fileUrl = supabase.storage
        .from('client-documents')
        .getPublicUrl(data.path).data.publicUrl;

      // Log the activity
      await supabase.from('client_activities').insert({
        client_id: clientId,
        activity_type: 'document_uploaded',
        description: `Uploaded document: ${file.name}`,
        metadata: {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: filePath,
          public_url: fileUrl
        }
      });

      return {
        success: true,
        filePath: data.path,
        fileUrl
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading,
    progress
  };
}
