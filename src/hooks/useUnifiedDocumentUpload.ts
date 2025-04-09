
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Define the return type for the upload function
export interface UploadResult {
  success: boolean;
  error?: string;
  documentId?: string;
  fileName?: string;
  publicUrl?: string;
}

export function useUnifiedDocumentUpload(clientId: string | undefined) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadDocument = async (file: File): Promise<UploadResult> => {
    if (!clientId) {
      return { success: false, error: 'Client ID is required' };
    }

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    setIsUploading(true);

    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${clientId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message };
      }

      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Add the document to the documents table
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert([
          {
            client_id: clientId,
            file_name: file.name,
            storage_path: filePath,
            file_type: file.type,
            file_size: file.size,
            status: 'uploaded'
          }
        ])
        .select()
        .single();

      if (docError) {
        console.error('Error inserting document record:', docError);
        return { success: false, error: docError.message };
      }

      return {
        success: true,
        documentId: docData.id,
        fileName: file.name,
        publicUrl: urlData.publicUrl
      };
    } catch (err) {
      console.error('Document upload error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error during upload'
      };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadDocument,
    isUploading
  };
}
