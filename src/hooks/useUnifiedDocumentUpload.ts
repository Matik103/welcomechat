
// Update hook to resolve the 'publicUrl' property issue
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  url?: string;
  path?: string;
}

interface UseUnifiedDocumentUploadOptions {
  clientId: string;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error | string) => void;
  onProgress?: (progress: number) => void;
}

export const useUnifiedDocumentUpload = ({
  clientId,
  onSuccess,
  onError,
  onProgress
}: UseUnifiedDocumentUploadOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = async (file: File): Promise<UploadResult> => {
    if (!clientId) {
      const error = new Error("Client ID is required for document upload");
      if (onError) onError(error);
      return { success: false, error: error.message };
    }

    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      // Generate unique ID for the document
      const documentId = uuidv4();
      
      // Create a file path for storage
      const fileExtension = file.name.split('.').pop() || '';
      const filePath = `${clientId}/${documentId}.${fileExtension}`;
      
      let pdfData;
      // If it's a PDF, convert to base64 for direct API submission
      if (file.type === 'application/pdf') {
        // Read the file to send directly to RapidAPI
        const reader = new FileReader();
        pdfData = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }
      
      // Upload the file to storage with progress tracking
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
        
      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }
      
      // Get the public URL for the uploaded file
      const { data: urlData } = await supabase.storage
        .from('client_documents')
        .getPublicUrl(filePath);
      
      const url = urlData?.publicUrl || '';
        
      // Create document record in the database
      const { data: documentData, error: documentError } = await supabase
        .from('document_content')
        .insert({
          client_id: clientId,
          document_id: documentId,
          content: '', // Will be filled by the extraction process
          metadata: {
            filename: file.name,
            file_type: file.type,
            size: file.size,
            upload_path: filePath,
            url: url,
            uploadedAt: new Date().toISOString()
          },
          file_type: file.type,
          filename: file.name
        })
        .select('id')
        .single();
        
      if (documentError) {
        throw new Error(`Document record creation failed: ${documentError.message}`);
      }
      
      // Invoke function to process the document
      const { data: processingData, error: processingError } = await supabase.functions.invoke(
        'process-pdf',
        {
          body: {
            client_id: clientId,
            document_id: documentId,
            file_path: filePath,
            file_type: file.type,
            filename: file.name,
            pdf_data: pdfData // Pass PDF data directly to the function
          }
        }
      );
      
      if (processingError) {
        console.warn('Warning: Document processing function error:', processingError);
        // This is a non-blocking error - document is uploaded but processing failed
      }
      
      const result: UploadResult = {
        success: true,
        documentId,
        url,
        path: filePath
      };
      
      if (onSuccess) onSuccess(result);
      
      return result;
    } catch (error) {
      console.error('Document upload error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (onError) onError(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return {
    upload,
    isLoading,
    uploadProgress
  };
};
