
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';
import { v4 as uuidv4 } from 'uuid';

export function useDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Upload a document to Supabase storage
   * @param file The file to upload
   * @returns Promise resolving when the upload is complete
   */
  const uploadDocument = async (file: File): Promise<void> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    setIsUploading(true);
    
    try {
      // Upload the file to storage
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${clientId}/${fileName}`;
      
      // Upload the original file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(DOCUMENTS_BUCKET)
        .getPublicUrl(filePath);
      
      console.log(`File uploaded successfully. Public URL: ${publicUrl}`);
      
      // Create a document link record
      const { error: linkError } = await supabase
        .from('document_links')
        .insert({
          client_id: clientId,
          document_type: file.type.includes('pdf') ? 'pdf' : 'document',
          link: publicUrl,
          storage_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        });
      
      if (linkError) {
        console.error('Error creating document link record:', linkError);
        throw new Error(`Failed to create document record: ${linkError.message}`);
      }
      
      toast.success(`Document "${file.name}" uploaded successfully`);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadDocument,
    isUploading
  };
}
