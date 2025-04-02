
/**
 * Utilities for converting documents to PDF format
 */

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
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const filename = extractFilenameFromUrl(url);
    return new File([blob], filename, { type: blob.type });
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
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
    filename = 'downloaded-document.pdf';
  }
  
  return filename;
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
