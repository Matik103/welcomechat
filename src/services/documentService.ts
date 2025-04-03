
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DOCUMENTS_BUCKET, ensureDocumentStorageBucket } from '@/utils/supabaseStorage';

interface UploadResult {
  success: boolean;
  documentId?: number;
  error?: string;
  processed?: number;
  failed?: number;
}

export const uploadDocument = async (clientId: string, file: File): Promise<UploadResult> => {
  try {
    if (!clientId) {
      return { success: false, error: 'Client ID is required' };
    }

    // Create a unique filepath
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `${clientId}/${fileName}`;

    console.log(`Attempting to upload to bucket: ${DOCUMENTS_BUCKET}`);
    
    // Ensure bucket exists before upload
    await ensureDocumentStorageBucket();

    // Upload to storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading document to storage:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get the public URL
    const { data: urlData } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Failed to generate public URL for document' };
    }

    // Store document metadata in the database
    const { data: documentData, error: documentError } = await supabase
      .from('ai_documents')
      .insert([
        {
          client_id: clientId,
          document_url: urlData.publicUrl,
          document_type: file.type,
          document_id: fileName,
          status: 'pending',
          agent_name: 'AI Assistant'
        }
      ])
      .select('id')
      .single();

    if (documentError) {
      console.error('Error storing document metadata:', documentError);
      return { success: false, error: documentError.message };
    }

    // Convert string id to number if needed
    const documentId = typeof documentData.id === 'string' 
      ? parseInt(documentData.id, 10) 
      : documentData.id;

    return {
      success: true,
      documentId: documentId,
      processed: 1,
      failed: 0
    };
  } catch (error) {
    console.error('Unexpected error in uploadDocument:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during document upload'
    };
  }
};
