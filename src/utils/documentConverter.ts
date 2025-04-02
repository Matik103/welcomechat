
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Do not re-import functions that are defined in this file
// import { isGoogleDriveUrl, getGoogleDriveDownloadUrl } from '@/utils/documentUtils';

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
 * Extracts text content from a document
 * @param file The file to extract text from
 * @returns The extracted text or null if extraction failed
 */
export async function extractTextFromDocument(file: File): Promise<string | null> {
  try {
    // This is a placeholder for text extraction logic
    // In a real implementation, this would use a library or API to extract text
    console.log('Text extraction not implemented yet');
    return '';
  } catch (error) {
    console.error('Failed to extract text from document:', error);
    return null;
  }
}

/**
 * Process a document URL and convert it to a downloadable format if needed
 * @param url The document URL to process
 * @returns An object with downloadUrl and fileName, or null if processing failed
 */
export async function processDocumentUrl(url: string): Promise<{ downloadUrl: string; fileName: string } | null> {
  try {
    if (isGoogleDriveUrl(url)) {
      const downloadUrl = await getGoogleDriveDownloadUrl(url);
      if (downloadUrl) {
        // Try to get the filename from the URL or use a default name
        const urlParts = url.split('/');
        const fileName = `google-drive-document-${urlParts[urlParts.length - 2] || 'unknown'}.pdf`;
        return { downloadUrl, fileName };
      }
    }
    
    // If it's already a downloadable URL, return it as is
    return { downloadUrl: url, fileName: getFileNameFromUrl(url) };
  } catch (error) {
    console.error('Failed to process document URL:', error);
    return null;
  }
}

/**
 * Download a file from a URL
 * @param url The URL to download from
 * @param fileName The name to give the downloaded file
 * @returns The downloaded file or null if download failed
 */
export async function downloadFileFromUrl(url: string, fileName: string): Promise<File | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to download file from ${url}: ${response.statusText}`);
      return null;
    }
    
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
    return file;
  } catch (error) {
    console.error('Failed to download file:', error);
    return null;
  }
}

/**
 * Get the file name from a URL
 * @param url The URL to extract the file name from
 * @returns The file name
 */
export function getFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    let fileName = pathParts[pathParts.length - 1];
    
    // If no filename is found, use a default
    if (!fileName || fileName === '') {
      fileName = 'downloaded-file';
    }
    
    // Remove query parameters if present
    if (fileName.includes('?')) {
      fileName = fileName.split('?')[0];
    }
    
    return fileName;
  } catch (error) {
    console.error('Failed to extract file name from URL:', error);
    return 'downloaded-file';
  }
}

/**
 * Check if a URL is a Google Drive URL
 * @param url The URL to check
 * @returns True if the URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}

/**
 * Get the direct download URL for a Google Drive file
 * @param url The Google Drive URL
 * @returns The direct download URL or null if conversion failed
 */
export async function getGoogleDriveDownloadUrl(url: string): Promise<string | null> {
  try {
    if (!isGoogleDriveUrl(url)) {
      return null;
    }
    
    // Extract the file ID from the URL
    let fileId = '';
    
    if (url.includes('/file/d/')) {
      // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
      const matches = url.match(/\/file\/d\/([^\/]+)/);
      if (matches && matches[1]) {
        fileId = matches[1];
      }
    } else if (url.includes('id=')) {
      // Format: https://drive.google.com/open?id=FILE_ID
      const urlObj = new URL(url);
      fileId = urlObj.searchParams.get('id') || '';
    } else if (url.includes('/document/d/')) {
      // Format: https://docs.google.com/document/d/FILE_ID/edit
      const matches = url.match(/\/document\/d\/([^\/]+)/);
      if (matches && matches[1]) {
        fileId = matches[1];
      }
    }
    
    if (!fileId) {
      console.error('Could not extract file ID from Google Drive URL');
      return null;
    }
    
    // Construct the download URL
    // For docs, use the export format. For other files, use the direct download link
    if (url.includes('docs.google.com/document')) {
      return `https://docs.google.com/document/d/${fileId}/export?format=pdf`;
    } else if (url.includes('docs.google.com/spreadsheets')) {
      return `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
    } else if (url.includes('docs.google.com/presentation')) {
      return `https://docs.google.com/presentation/d/${fileId}/export/pdf`;
    } else {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  } catch (error) {
    console.error('Failed to get Google Drive download URL:', error);
    return null;
  }
}

/**
 * Get the content type of a file based on its extension
 * @param fileName The file name
 * @returns The content type
 */
export function getContentTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const contentTypeMap: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',
    md: 'text/markdown',
    json: 'application/json',
    html: 'text/html',
    htm: 'text/html',
    xml: 'application/xml',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    '7z': 'application/x-7z-compressed',
  };
  
  return contentTypeMap[extension] || 'application/octet-stream';
}
