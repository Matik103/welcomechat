import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';
import { DocumentProcessingResult } from '@/types/document-processing';
import { v4 as uuidv4 } from 'uuid';

interface UploadResult {
  success: boolean;
  error?: string;
  documentId?: number;
}

const getEffectiveClientId = async (clientId: string) => {
  try {
    const { data: clientData, error: clientError } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("interaction_type", "config")
      .or(`id.eq.${clientId},client_id.eq.${clientId}`)
      .single();
      
    if (clientError) {
      console.error("Error finding client:", clientError);
      throw new Error("Could not find client record");
    }
    
    if (!clientData) {
      throw new Error("Client not found");
    }
    
    return clientData.id;
  } catch (error) {
    console.error("Error getting effective client ID:", error);
    throw error;
  }
};

export function useDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadDocument = async (file: File): Promise<UploadResult> => {
    if (!clientId) {
      toast.error('Client ID is required');
      return { success: false, error: 'Client ID is required' };
    }

    setIsUploading(true);

    try {
      // Create a unique file path with a clean filename
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      const uniqueFileName = `${uuidv4()}-${cleanFileName}`;
      const filePath = `${clientId}/${uniqueFileName}`;

      // Upload file to Supabase Storage in document-storage bucket
      const { error: uploadError } = await supabase.storage
        .from('document-storage')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type // Ensure proper content type is set
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from('document-storage')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get document URL');
      }

      // Create document link record
      const { data: documentLink, error: linkError } = await supabase
        .from('document_links')
        .insert({
          client_id: clientId,
          link: urlData.publicUrl,
          document_type: fileExtension || 'document',
          refresh_rate: 30,
          access_status: 'accessible',
          file_name: cleanFileName,
          file_size: file.size,
          mime_type: file.type,
          storage_path: filePath
        })
        .select()
        .single();

      if (linkError) {
        // If link creation fails, try to delete the uploaded file
        await supabase.storage
          .from('document-storage')
          .remove([filePath]);
          
        console.error('Error creating document link:', linkError);
        throw new Error(`Error creating document link: ${linkError.message}`);
      }

      toast.success('Document uploaded successfully');
      return {
        success: true,
        documentId: documentLink.id
      };

    } catch (error) {
      console.error('Document upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
