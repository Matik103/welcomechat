
import { DocumentProcessingOptions, DocumentProcessingResult } from "@/types/document-processing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LlamaCloudService } from "@/utils/LlamaCloudService";
import { checkBucketExists } from "@/utils/storageUtils";

/**
 * Upload a document to storage
 * @param file The file to upload
 * @param options Options for processing the document
 * @returns The path to the document in storage
 */
export const uploadDocument = async (
  file: File,
  options: DocumentProcessingOptions
): Promise<string> {
  try {
    // Check if storage bucket exists
    const bucketExists = await checkBucketExists('Document Storage');
    
    if (!bucketExists) {
      throw new Error('Document Storage bucket does not exist in Supabase');
    }

    // Generate a unique path for the document
    const timestamp = Date.now();
    const uniquePath = `${options.clientId}/${timestamp}-${file.name}`;
    
    // Report progress as the upload begins
    if (options.onUploadProgress) {
      options.onUploadProgress(10);
    }
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('Document Storage')
      .upload(uniquePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error('Error uploading document:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    if (!data?.path) {
      throw new Error('Upload completed but no path was returned');
    }
    
    // Report progress as completed after upload
    if (options.onUploadProgress) {
      options.onUploadProgress(100);
    }
    
    // Return the path to the document in storage
    return data.path;
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
};

export class DocumentProcessingService {
  /**
   * Process a document with LlamaParse
   * @param documentPath The path to the document in storage
   * @param documentType The type of the document
   * @param clientId The client ID
   * @param agentName The agent name
   * @returns A promise that resolves to the result of processing the document
   */
  static async processDocument(
    documentPath: string,
    documentType: string,
    clientId: string,
    agentName: string
  ): Promise<DocumentProcessingResult> {
    try {
      // Call the LlamaCloud service to parse the document
      const parseResponse = await LlamaCloudService.parseDocument(
        documentPath,
        documentType,
        clientId,
        agentName
      );

      if (!parseResponse.success) {
        throw new Error(parseResponse.error || 'Document parsing failed');
      }

      // Format and return the result
      return {
        success: true,
        status: 'completed',
        documentId: parseResponse.documentId || documentPath,
        documentUrl: documentPath,
        documentType,
        clientId,
        agentName,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        chunks: [],
        metadata: {
          path: documentPath,
          processedAt: new Date().toISOString(),
          method: 'llamaparse',
          publicUrl: parseResponse.metadata?.documentUrl || '',
          title: parseResponse.metadata?.title || '',
          author: parseResponse.metadata?.author || '',
          createdAt: parseResponse.metadata?.createdAt || '',
          pageCount: parseResponse.metadata?.pageCount || 0,
          totalChunks: 0,
          characterCount: parseResponse.content?.length || 0,
          wordCount: parseResponse.content?.split(/\s+/).length || 0,
          averageChunkSize: 0,
          language: parseResponse.metadata?.language || 'en'
        }
      };
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }
}
