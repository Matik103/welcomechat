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
  shouldProcessWithOpenAI?: boolean;
  agentName?: string;
}

/**
 * Unified document upload service that handles both storage and OpenAI processing
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
          status: options.shouldProcessWithOpenAI ? 'pending' : 'completed',
          agent_name: options.agentName || 'AI Assistant'
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

    // If OpenAI processing is requested, send to Edge Function
    if (options.shouldProcessWithOpenAI) {
      try {
        // Read file as base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix if present
            const base64Clean = base64.replace(/^data:[^;]+;base64,/, '');
            resolve(base64Clean);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Call Edge Function to process with OpenAI
        const { data: openAIData, error: openAIError } = await supabase.functions.invoke(
          'upload-file-to-openai',
          {
            body: {
              client_id: clientId,
              file_data: base64Data,
              file_type: file.type,
              file_name: file.name,
              document_id: documentId
            }
          }
        );

        if (openAIError) {
          console.error('Error processing with OpenAI:', openAIError);
          toast.warning('Document uploaded but AI processing failed');
        } else {
          console.log('OpenAI processing successful:', openAIData);
        }
      } catch (openAIError) {
        console.error('Error in OpenAI processing:', openAIError);
        toast.warning('Document uploaded but AI processing failed');
      }
    }

    return {
      success: true,
      documentId: documentId.toString(),
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
