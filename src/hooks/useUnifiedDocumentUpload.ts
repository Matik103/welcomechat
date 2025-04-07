import { useState, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useClientActivity } from './useClientActivity';
import { API_CONFIG, isProduction, PDF_PROCESSING } from '@/config/env';

interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  publicUrl?: string;
  fileName?: string;
}

interface UseUnifiedDocumentUploadProps {
  clientId: string;
  onSuccess?: (result: { success: boolean; documentId?: string; error?: string; publicUrl?: string; fileName?: string }) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export function useUnifiedDocumentUpload({
  clientId,
  onSuccess,
  onError,
  onProgress,
}: UseUnifiedDocumentUploadProps) {
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const { logClientActivity } = useClientActivity(clientId);
  const IS_PRODUCTION = isProduction();

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (!clientId) {
        toast.error('Client ID is required');
        return { success: false, error: 'Client ID is required' };
      }

      const uploadWithRetry = async (file: File, retryCount = 0): Promise<UploadResult> => {
        try {
          // Set the timeout duration based on file size and environment
          const timeoutDuration = calculateTimeoutDuration(file.size);
          
          // Create AbortController for timeout handling
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

          // Generate a unique file name
          const fileName = `${uuidv4()}-${file.name}`;

          // Upload the file to Supabase storage
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('client_documents')
            .upload(`${clientId}/${fileName}`, file, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type,
              signal: controller.signal, // Pass the AbortSignal
            });

          if (uploadError) {
            console.error('File upload error:', uploadError);
            clearTimeout(timeoutId); // Clear timeout if upload fails
            if (retryCount < PDF_PROCESSING.maxRetries) {
              const delay = PDF_PROCESSING.retryDelay * (retryCount + 1);
              console.log(`Retrying upload in ${delay}ms (attempt ${retryCount + 1}/${PDF_PROCESSING.maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return uploadWithRetry(file, retryCount + 1); // Recursive retry
            } else {
              toast.error(`File upload failed after multiple retries: ${uploadError.message}`);
              return { success: false, error: `File upload failed after multiple retries: ${uploadError.message}` };
            }
          }

          // Clear the timeout if the upload is successful
          clearTimeout(timeoutId);

          // Get the public URL of the uploaded file
          const { data: publicUrlData } = supabaseClient.storage
            .from('client_documents')
            .getPublicUrl(`${clientId}/${fileName}`);

          if (!uploadData?.path) {
            console.error('File path is missing in upload response');
            return { success: false, error: 'File path is missing in upload response' };
          }

          // Create a record in the database
          const { data: documentData, error: documentError } = await supabaseClient
            .from('client_documents')
            .insert([
              {
                client_id: clientId,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                storage_path: uploadData.path,
                storage_url: publicUrlData.publicUrl,
                user_id: user?.id,
              },
            ])
            .select()
            .single();

          if (documentError) {
            console.error('Database insert error:', documentError);
            return { success: false, error: `Database insert error: ${documentError.message}` };
          }

          // Log client activity
          await logClientActivity('document_uploaded', `Document "${file.name}" uploaded`, {
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: uploadData.path,
            storage_url: publicUrlData.publicUrl,
          });

          // Call onSuccess callback
          if (onSuccess) {
            onSuccess({
              success: true,
              documentId: documentData.id,
              publicUrl: publicUrlData.publicUrl,
              fileName: file.name,
            });
          }

          return {
            success: true,
            documentId: documentData.id,
            publicUrl: publicUrlData.publicUrl,
            fileName: file.name,
          };
        } catch (error: any) {
          console.error('Upload error:', error);
          
          // Check if the error is an AbortError (timeout)
          if (error.name === 'AbortError') {
            toast.error(`File upload timed out after ${timeoutDuration / 60000} minutes. Please try again with a smaller file or a better connection.`);
            return { success: false, error: `File upload timed out after ${timeoutDuration / 60000} minutes.` };
          }
          
          if (onError) {
            onError(error.message);
          }
          return { success: false, error: error.message };
        }
      };

      // Helper function to calculate appropriate timeout duration based on file size
      const calculateTimeoutDuration = (fileSize: number): number => {
        const baseDuration = IS_PRODUCTION ? 900000 : 600000; // 15 mins prod, 10 mins dev
        
        // For very large files (>100MB), increase timeout further
        if (fileSize > 100 * 1024 * 1024) {
          return baseDuration * 1.5; // 22.5 mins prod, 15 mins dev
        }
        
        return baseDuration;
      };

      return uploadWithRetry(file, 0);
    },
    [supabaseClient, user, clientId, onSuccess, onError, logClientActivity]
  );

  return { upload };
}
