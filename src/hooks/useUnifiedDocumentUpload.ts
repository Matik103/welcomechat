
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Define the return type for the upload function
export interface UploadResult {
  success: boolean;
  error?: string;
  documentId?: string;
  fileName?: string;
  publicUrl?: string;
}

interface UploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onProgress?: (progress: number) => void;
}

export function useUnifiedDocumentUpload(options: {
  clientId: string | undefined;
  onSuccess?: (result: UploadResult) => void;
  onProgress?: (progress: number) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const { clientId, onSuccess, onProgress } = options;

  const upload = async (file: File): Promise<UploadResult> => {
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

      // Get the client's assistant
      const { data: assistantData, error: assistantError } = await supabase
        .from('ai_agents')
        .select('openai_assistant_id, name')
        .eq('client_id', clientId)
        .single();
        
      if (!assistantError && assistantData?.openai_assistant_id) {
        // Store document in document_content table
        const { data: contentData, error: contentError } = await supabase
          .from('document_content')
          .insert({
            client_id: clientId,
            document_id: docData.id,
            content: null, // This will be filled when processed
            filename: file.name,
            file_type: file.type,
            metadata: {
              size: file.size,
              storage_path: filePath,
              storage_url: urlData.publicUrl,
              uploadedAt: new Date().toISOString(),
              processing_status: file.type === 'application/pdf' ? 'pending_extraction' : 'ready'
            }
          })
          .select()
          .single();

        if (contentError) {
          console.error('Error storing document content:', contentError);
        } else {
          // Give assistant access to the document
          try {
            const { data: assistDocData, error: assistDocError } = await supabase
              .from('assistant_documents')
              .insert({
                assistant_id: assistantData.openai_assistant_id,
                document_id: contentData.id,
                client_id: clientId,
                status: 'ready'
              });
              
            if (assistDocError) {
              console.error('Error associating document with assistant:', assistDocError);
            } else {
              console.log('Assistant now has access to document:', contentData.id);
            }
            
            // If it's a PDF, trigger the extraction process
            if (file.type === 'application/pdf') {
              try {
                const { error: extractionError } = await supabase.functions.invoke('process-pdf', {
                  body: { 
                    document_id: contentData.id.toString(),
                    storage_path: filePath
                  }
                });

                if (extractionError) {
                  console.error('PDF extraction error:', extractionError);
                }
              } catch (extractionError) {
                console.error('Failed to invoke PDF extraction:', extractionError);
              }
            }
          } catch (error) {
            console.error('Error in assistant document access:', error);
          }
        }
      }

      const result = {
        success: true,
        documentId: docData.id,
        fileName: file.name,
        publicUrl: urlData.publicUrl
      };
      
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
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
    upload,
    isUploading
  };
}
