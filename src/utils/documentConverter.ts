
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Converts a document to the specified format
 * @param file The file to convert
 * @param targetFormat The format to convert to
 * @returns The converted file or null if conversion failed
 */
export async function convertDocument(
  file: File,
  targetFormat: string = 'pdf'
): Promise<File | null> {
  // Currently, we only support PDF conversion
  // This is a placeholder for future conversion capabilities
  if (targetFormat.toLowerCase() !== 'pdf') {
    console.error(`Conversion to ${targetFormat} is not supported yet`);
    return null;
  }

  // Check if file is already a PDF
  if (file.type === 'application/pdf') {
    console.log('File is already a PDF, no conversion needed');
    return file;
  }

  try {
    // For now, we'll just return the original file since actual conversion
    // would require a backend service. In a real implementation, this would
    // call an API to convert the file.
    console.log(`Conversion from ${file.type} to PDF is not implemented yet`);
    toast.info('Document conversion is not available yet, using original format');
    return file;
  } catch (error) {
    console.error('Failed to convert document:', error);
    toast.error('Failed to convert document');
    return null;
  }
}

/**
 * Convert a file to PDF if it's not already in PDF format
 * @param file The file to convert
 * @returns The PDF file or the original file if conversion failed
 */
export async function convertToPdfIfNeeded(file: File): Promise<File> {
  if (file.type === 'application/pdf') {
    return file; // Already a PDF
  }

  try {
    const pdfFile = await convertDocument(file, 'pdf');
    return pdfFile || file; // Return the converted file or original if conversion failed
  } catch (error) {
    console.error('Failed to convert to PDF:', error);
    return file; // Return original file on error
  }
}

/**
 * Upload a document to Supabase storage
 * @param file The file to upload
 * @param clientId The client ID to associate with the file
 * @returns Object with upload result information
 */
export async function uploadDocumentToStorage(
  file: File,
  clientId: string
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  try {
    // Ensure the document storage bucket exists
    await supabase.rpc('ensure_document_storage_bucket');
    
    // Create a unique path with timestamp to prevent collisions
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const filePath = `${clientId}/${timestamp}-${file.name}`;
    
    // Upload the file to storage
    const { data, error } = await supabase.storage
      .from('document-storage')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });
    
    if (error) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // Get the public URL for the file
    const { data: urlData } = supabase.storage
      .from('document-storage')
      .getPublicUrl(data.path);
    
    // Process the document upload
    const result = await supabase.rpc('process_document_upload', {
      file_path: data.path,
      filename: file.name,
      content_type: file.type,
      file_size: file.size
    });
    
    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Error in uploadDocumentToStorage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
