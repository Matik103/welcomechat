
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
      
      // If it's a PDF, convert to base64 for direct API submission
      let pdfData;
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        // Read the PDF file as base64
        const reader = new FileReader();
        pdfData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        // Simulate progress while processing
        setUploadProgress(30);
        
        try {
          // Directly invoke function to process the document with the PDF data
          const { data: processingData, error: processingError } = await supabase.functions.invoke(
            'process-pdf',
            {
              body: {
                client_id: clientId,
                document_id: documentId,
                file_name: file.name,
                file_type: file.type,
                pdf_data: pdfData
              }
            }
          );
          
          if (processingError) {
            console.warn('Warning: Document processing function error:', processingError);
          } else if (processingData?.text) {
            extractedText = processingData.text;
            console.log('Successfully extracted text from PDF, length:', extractedText.length);
          }
        } catch (error) {
          console.error('Error during PDF text extraction:', error);
        }
        
        setUploadProgress(70);
      }
      
      // Upload the file to storage
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
      
      setUploadProgress(90);
      
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
          content: extractedText, // Add extracted text directly
          metadata: {
            filename: file.name,
            file_type: file.type,
            size: file.size,
            upload_path: filePath,
            url: url,
            uploadedAt: new Date().toISOString(),
            processing_status: extractedText ? 'completed' : 'pending_extraction' 
          },
          file_type: file.type,
          filename: file.name
        })
        .select('id')
        .single();
        
      if (documentError) {
        throw new Error(`Document record creation failed: ${documentError.message}`);
      }
      
      setUploadProgress(100);
      
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
    }
  };

  return {
    upload,
    isLoading,
    uploadProgress
  };
};
