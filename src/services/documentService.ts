import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { uploadToDocumentStorage } from '@/utils/supabaseStorage';

interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  processed?: number;
  failed?: number;
  documentUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface UploadOptions {
  agentName?: string;
}

/**
 * Unified document upload service that handles storage and database updates
 */
export const uploadDocument = async (
  clientId: string, 
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    if (!clientId) {
      return { success: false, error: 'Client ID is required' };
    }

    console.log('Starting document upload for client:', clientId);

    // Upload to storage bucket
    const { path: filePath, url: publicUrl } = await uploadToDocumentStorage(file, clientId);

    // Store document metadata in the database
    const { data: documentData, error: documentError } = await supabase
      .from('ai_documents')
      .insert([
        {
          client_id: clientId,
          document_url: publicUrl,
          document_type: file.type,
          document_id: filePath,
          status: 'pending',
          agent_name: options.agentName || 'AI Assistant'
        }
      ])
      .select('id')
      .single();

    if (documentError) {
      console.error('Error storing document metadata:', documentError);
      return { success: false, error: documentError.message };
    }

    return {
      success: true,
      documentId: documentData.id.toString(),
      documentUrl: publicUrl,
      fileName: file.name,
      fileType: file.type,
      processed: 1,
      failed: 0
    };
  } catch (error) {
    console.error('Unexpected error in uploadDocument:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during document upload',
      processed: 0,
      failed: 1,
      fileName: file.name,
      fileType: file.type
    };
  }
};
