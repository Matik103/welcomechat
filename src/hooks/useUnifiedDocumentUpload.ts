// Streamlined document upload hook with direct RapidAPI integration
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

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

interface DocumentData {
  id: number;
  metadata?: {
    filename?: string;
    file_type?: string;
    size?: number;
    upload_path?: string;
    url?: string;
    uploadedAt?: string;
    processing_status?: string;
    error?: string;
    extracted_at?: string;
  };
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
      
      setUploadProgress(20);
      
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
      
      setUploadProgress(50);
      
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
          content: null,
          metadata: {
            filename: file.name,
            file_type: file.type,
            size: file.size,
            upload_path: filePath,
            url: url,
            uploadedAt: new Date().toISOString(),
            processing_status: file.type === 'application/pdf' ? 'pending_extraction' : 'ready'
          },
          file_type: file.type,
          filename: file.name
        })
        .select('id, metadata')
        .single();
        
      if (documentError) {
        throw new Error(`Document record creation failed: ${documentError.message}`);
      }
      
      setUploadProgress(80);
      
      // If it's a PDF, process it with RapidAPI via Supabase Edge Function
      if (file.type === 'application/pdf') {
        try {
          toast('Processing PDF document...', { icon: '📄' });
          
          // Read the PDF file as base64 to send to the edge function
          const reader = new FileReader();
          const pdfData = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read PDF file'));
            reader.readAsDataURL(file);
          });
          
          console.log('Sending PDF to edge function for processing...');
          
          // Process PDF with RapidAPI via Supabase Edge Function
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
            console.error('Error during PDF text extraction:', processingError);
            toast('PDF text extraction failed. The document was uploaded but text extraction will need to be retried.', { icon: '❌' });
            
            // Update document status to indicate failed extraction
            await supabase
              .from('document_content')
              .update({ 
                metadata: { 
                  filename: documentData?.metadata?.filename,
                  file_type: documentData?.metadata?.file_type,
                  size: documentData?.metadata?.size,
                  upload_path: documentData?.metadata?.upload_path,
                  url: documentData?.metadata?.url,
                  uploadedAt: documentData?.metadata?.uploadedAt,
                  processing_status: 'extraction_failed',
                  error: processingError.message 
                } 
              })
              .eq('id', documentData?.id);
          } else {
            console.log('PDF processing response:', processingData);
            if (processingData?.text) {
              console.log('Successfully extracted text from PDF, length:', processingData.text.length);
              toast('PDF processed successfully!', { icon: '✅' });
              
              // Update document status to indicate successful extraction
              await supabase
                .from('document_content')
                .update({ 
                  metadata: { 
                    filename: documentData?.metadata?.filename,
                    file_type: documentData?.metadata?.file_type,
                    size: documentData?.metadata?.size,
                    upload_path: documentData?.metadata?.upload_path,
                    url: documentData?.metadata?.url,
                    uploadedAt: documentData?.metadata?.uploadedAt,
                    processing_status: 'extraction_complete',
                    extracted_at: new Date().toISOString()
                  } 
                })
                .eq('id', documentData?.id);
            } else {
              console.warn('No text extracted from PDF or unexpected response format');
              toast('PDF uploaded but no text was extracted. The document may be empty or scanned.', { icon: '⚠️' });
            }
          }
        } catch (error) {
          console.error('Error during PDF text extraction:', error);
          toast('Failed to process PDF. The document was uploaded but text extraction will need to be retried.', { icon: '❌' });
          
          // Update document status to indicate failed extraction
          await supabase
            .from('document_content')
            .update({ 
              metadata: { 
                filename: documentData?.metadata?.filename,
                file_type: documentData?.metadata?.file_type,
                size: documentData?.metadata?.size,
                upload_path: documentData?.metadata?.upload_path,
                url: documentData?.metadata?.url,
                uploadedAt: documentData?.metadata?.uploadedAt,
                processing_status: 'extraction_failed',
                error: error instanceof Error ? error.message : 'Unknown error' 
              } 
            })
            .eq('id', documentData?.id);
        }
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
