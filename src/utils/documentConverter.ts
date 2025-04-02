
/**
 * Utilities for converting documents to PDF format and handling URLs
 */

import { isGoogleDriveUrl, getGoogleDriveDownloadUrl } from './documentConverter'; 

/**
 * Convert a document to PDF if needed
 * @param file The file to potentially convert
 * @returns A Promise resolving to the (potentially converted) file
 */
export const convertToPdfIfNeeded = async (file: File): Promise<File> => {
  // Check if file is already a PDF
  if (file.type === 'application/pdf') {
    console.log('File is already a PDF, skipping conversion');
    return file;
  }

  console.log(`Converting file from ${file.type} to PDF`);
  
  // For now, we'll just pass through the file
  // In a real implementation, you'd integrate with a PDF conversion service
  // like pdf.js, jsPDF, or a server-side solution
  
  // This is a placeholder for actual conversion logic
  // Return the original file for now
  return file;
};

/**
 * Download a file from a URL
 * @param url The URL to download from
 * @returns A Promise resolving to a File object
 */
export const downloadFileFromUrl = async (url: string): Promise<File> => {
  try {
    console.log(`Downloading file from URL: ${url}`);
    
    // Check if it's a Google Drive URL and get the direct download link
    if (isGoogleDriveUrl(url)) {
      url = getGoogleDriveDownloadUrl(url);
      console.log(`Converted to direct download URL: ${url}`);
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const filename = extractFilenameFromUrl(url);
    
    // Set appropriate content type if it can be determined
    const contentType = determineContentType(url, blob.type);
    
    return new File([blob], filename, { type: contentType });
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * Determine the content type from URL and blob type
 * @param url The URL of the file
 * @param blobType The MIME type from the blob
 * @returns The determined content type
 */
const determineContentType = (url: string, blobType: string): string => {
  // If blob has a valid type, use it
  if (blobType && blobType !== 'application/octet-stream') {
    return blobType;
  }
  
  // Try to determine type from URL extension
  const extension = url.split('.').pop()?.toLowerCase();
  if (extension) {
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt': return 'text/plain';
      case 'csv': return 'text/csv';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'ppt': return 'application/vnd.ms-powerpoint';
      case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }
  }
  
  // Default to binary if can't determine
  return 'application/octet-stream';
};

/**
 * Extract a filename from a URL
 * @param url The URL to extract from
 * @returns The extracted filename
 */
const extractFilenameFromUrl = (url: string): string => {
  // Try to extract filename from URL
  const urlParts = url.split('/');
  let filename = urlParts[urlParts.length - 1];
  
  // Remove query parameters if present
  if (filename.includes('?')) {
    filename = filename.split('?')[0];
  }
  
  // If no reasonable filename, use a default
  if (!filename || filename.length < 3) {
    // Try to determine type from URL
    const extension = determineExtensionFromUrl(url);
    filename = `downloaded-document${extension}`;
  }
  
  return filename;
};

/**
 * Determine file extension from URL
 * @param url The URL to analyze
 * @returns The file extension with dot
 */
const determineExtensionFromUrl = (url: string): string => {
  if (url.includes('drive.google.com') || url.includes('docs.google.com/document')) {
    return '.pdf';
  }
  
  if (url.includes('docs.google.com/spreadsheets')) {
    return '.xlsx';
  }
  
  if (url.includes('docs.google.com/presentation')) {
    return '.pptx';
  }
  
  return '.pdf'; // Default to PDF
};

/**
 * Check if a URL is a Google Drive URL
 * @param url The URL to check
 * @returns True if it's a Google Drive URL
 */
export const isGoogleDriveUrl = (url: string): boolean => {
  return url.includes('drive.google.com') || 
         url.includes('docs.google.com') || 
         url.includes('sheets.google.com') ||
         url.includes('slides.google.com');
};

/**
 * Get a direct download URL for Google Drive documents
 * @param url The Google Drive URL
 * @returns A direct download URL
 */
export const getGoogleDriveDownloadUrl = (url: string): string => {
  // Handle Google Drive links
  if (url.includes('drive.google.com/file/d/')) {
    // Convert file link to download link
    const fileId = url.match(/\/file\/d\/([^\/]+)/)?.[1];
    if (fileId) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }
  
  // Handle Google Docs/Sheets/Slides links
  if (url.includes('docs.google.com/document')) {
    return url.replace(/\/edit.*$/, '/export?format=pdf');
  }
  
  if (url.includes('docs.google.com/spreadsheets')) {
    return url.replace(/\/edit.*$/, '/export?format=pdf');
  }
  
  if (url.includes('docs.google.com/presentation')) {
    return url.replace(/\/edit.*$/, '/export?format=pdf');
  }
  
  // If we can't transform, return the original URL
  return url;
};

/**
 * Process a document URL with LlamaIndex
 * @param url The URL to process
 * @returns Processing result
 */
export const processUrlWithLlamaIndex = async (url: string): Promise<{
  success: boolean;
  text?: string;
  error?: string;
}> => {
  try {
    // Download the file first
    const file = await downloadFileFromUrl(url);
    
    // Then process it with LlamaIndex (this would call the LlamaIndex service)
    // This is a placeholder - the actual implementation would be in the LlamaIndex service
    console.log(`Document downloaded from URL: ${url}, ready for LlamaIndex processing`);
    
    // Return placeholder success
    return {
      success: true,
      text: `Document content from URL: ${url}`
    };
  } catch (error) {
    console.error('Error processing URL with LlamaIndex:', error);
    return {
      success: false,
      error: `Failed to process URL: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
