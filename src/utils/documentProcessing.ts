
import { ValidationResult, DocumentChunk } from '@/types/document-processing';

// Utility function to validate document links
export const validateDocumentLink = (url: string): ValidationResult => {
  // Basic validation to check if URL is provided
  if (!url || url.trim() === '') {
    return {
      isValid: false,
      errors: ['URL is required'],
      status: 'error',
      message: 'URL is required'
    };
  }

  // Basic validation for URL format
  try {
    new URL(url);
  } catch (e) {
    return {
      isValid: false,
      errors: ['Invalid URL format'],
      status: 'error',
      message: 'Invalid URL format'
    };
  }

  // Check for supported document types
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    return {
      isValid: true,
      errors: [],
      status: 'success',
      message: 'Google Drive link is valid'
    };
  } else if (url.endsWith('.pdf') || url.endsWith('.doc') || url.endsWith('.docx') || 
             url.endsWith('.txt') || url.endsWith('.rtf') || url.endsWith('.csv') || 
             url.endsWith('.xlsx') || url.endsWith('.ppt') || url.endsWith('.pptx')) {
    return {
      isValid: true,
      errors: [],
      status: 'success',
      message: 'Document link is valid'
    };
  }

  // Return warning for other URLs
  return {
    isValid: true,
    errors: ['URL may not be a supported document type'],
    status: 'warning',
    message: 'URL may not be a supported document type'
  };
};

// Format file size to human-readable string
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Process text content into chunks
export const chunkTextContent = (text: string, maxChunkSize: number = 1000): DocumentChunk[] => {
  if (!text) return [];
  
  // Split by paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: DocumentChunk[] = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length < maxChunkSize) {
      currentChunk += paragraph + '\n\n';
    } else {
      if (currentChunk !== '') {
        chunks.push({ 
          content: currentChunk.trim(),
          id: `chunk-${chunks.length + 1}`
        });
      }
      currentChunk = paragraph + '\n\n';
    }
  }
  
  // Add the last chunk if not empty
  if (currentChunk !== '') {
    chunks.push({ 
      content: currentChunk.trim(),
      id: `chunk-${chunks.length + 1}`
    });
  }
  
  return chunks;
};
