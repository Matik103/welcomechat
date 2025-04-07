
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useClientActivity } from './useClientActivity';
import { API_CONFIG, isProduction, PDF_PROCESSING } from '@/config/env';

// Export this interface so other components can use it
export interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  publicUrl?: string;
  fileName?: string;
}

interface UseUnifiedDocumentUploadProps {
  clientId: string;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: unknown) => void;
  onProgress?: (progress: number) => void;
}

export function useUnifiedDocumentUpload({
  clientId,
  onSuccess,
  onError,
  onProgress,
}: UseUnifiedDocumentUploadProps) {
  const { logClientActivity } = useClientActivity(clientId);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const IS_PRODUCTION = isProduction();

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (!clientId) {
        toast.error('Client ID is required');
        return { success: false, error: 'Client ID is required' };
      }

      setIsLoading(true);
      try {
        // Update progress for UI feedback
        if (onProgress) onProgress(10);
        setUploadProgress(10);
        
        const uploadWithRetry = async (file: File, retryCount = 0): Promise<UploadResult> => {
          try {
            // Set the timeout duration based on file size and environment
            const timeoutDuration = calculateTimeoutDuration(file.size);
            
            // Create AbortController for timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

            // Update progress
            if (onProgress) onProgress(20);
            setUploadProgress(20);

            // Generate a unique file name
            const fileName = `${uuidv4()}-${file.name}`;

            // Upload the file to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('client_documents')
              .upload(`${clientId}/${fileName}`, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type,
                signal: controller.signal, // Pass the AbortSignal
              });

            // Update progress
            if (onProgress) onProgress(50);
            setUploadProgress(50);

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
            
            // Update progress
            if (onProgress) onProgress(70);
            setUploadProgress(70);

            // Get the public URL of the uploaded file
            const { data: publicUrlData } = supabase.storage
              .from('client_documents')
              .getPublicUrl(`${clientId}/${fileName}`);

            if (!uploadData?.path) {
              console.error('File path is missing in upload response');
              return { success: false, error: 'File path is missing in upload response' };
            }

            // Update progress
            if (onProgress) onProgress(80);
            setUploadProgress(80);

            // Create a record in the database
            const { data: documentData, error: documentError } = await supabase
              .from('client_documents')
              .insert([
                {
                  client_id: clientId,
                  file_name: file.name,
                  file_type: file.type,
                  file_size: file.size,
                  storage_path: uploadData.path,
                  storage_url: publicUrlData.publicUrl,
                  user_id: (await supabase.auth.getUser()).data.user?.id
                }
              ])
              .select()
              .single();

            if (documentError) {
              console.error('Database insert error:', documentError);
              return { success: false, error: `Database insert error: ${documentError.message}` };
            }

            // Update progress
            if (onProgress) onProgress(90);
            setUploadProgress(90);

            // Log client activity
            await logClientActivity('document_uploaded', `Document "${file.name}" uploaded`, {
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              storage_path: uploadData.path,
              storage_url: publicUrlData.publicUrl,
            });

            // Update progress to complete
            if (onProgress) onProgress(100);
            setUploadProgress(100);

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
          } catch (error) {
            console.error('Upload error:', error);
            
            // Check if the error is an AbortError (timeout)
            if (error instanceof DOMException && error.name === 'AbortError') {
              const timeoutDuration = calculateTimeoutDuration(file.size);
              toast.error(`File upload timed out after ${timeoutDuration / 60000} minutes. Please try again with a smaller file or a better connection.`);
              return { success: false, error: `File upload timed out after ${timeoutDuration / 60000} minutes.` };
            }
            
            if (onError) {
              onError(error);
            }
            return { success: false, error: error instanceof Error ? error.message : String(error) };
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

        return await uploadWithRetry(file, 0);
      } catch (error) {
        console.error('Top-level upload error:', error);
        if (onError) {
          onError(error);
        }
        return { 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        };
      } finally {
        setIsLoading(false);
        // Reset progress
        setUploadProgress(0);
      }
    },
    [clientId, onSuccess, onError, onProgress, logClientActivity, IS_PRODUCTION]
  );

  return { 
    upload, 
    isLoading, 
    uploadProgress 
  };
}
