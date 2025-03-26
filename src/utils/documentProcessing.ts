
import { supabase } from '@/integrations/supabase/client';
import { DocumentChunk, ValidationResult } from '@/types/document-processing';

export const validateDocumentLink = (url: string): ValidationResult => {
  // Check if the URL is empty
  if (!url.trim()) {
    return {
      isValid: false,
      errors: ['URL cannot be empty'],
      message: 'URL cannot be empty'
    };
  }

  // Try to parse the URL
  try {
    new URL(url);
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid URL format'],
      message: 'Invalid URL format'
    };
  }

  // Check if URL is from supported domains
  const supportedDomains = [
    'drive.google.com',
    'docs.google.com',
    'sheets.google.com',
    'dropbox.com',
    'office.com',
    'onedrive.live.com',
    'sharepoint.com'
  ];

  const domainMatch = supportedDomains.some(domain => url.includes(domain));
  if (!domainMatch) {
    return {
      isValid: false,
      errors: ['Unsupported document service'],
      message: 'Unsupported document service'
    };
  }

  return {
    isValid: true,
    errors: []
  };
};

export const validateDocumentFile = (file: File): ValidationResult => {
  // Check file size (limit to 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      errors: ['File size exceeds 10MB limit'],
      message: 'File size exceeds 10MB limit'
    };
  }

  // Check file type
  const supportedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (!supportedTypes.includes(file.type)) {
    return {
      isValid: false,
      errors: ['Unsupported file type'],
      message: 'Unsupported file type'
    };
  }

  return {
    isValid: true,
    errors: []
  };
};

export const extractTextChunks = (text: string, maxChunkSize: number = 1000): DocumentChunk[] => {
  const chunks: DocumentChunk[] = [];
  
  // Split text into paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the chunk size,
    // save the current chunk and start a new one
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        id: `chunk-${chunks.length}`,
        content: currentChunk.trim()
      });
      currentChunk = '';
    }
    
    // Add the paragraph to the current chunk
    currentChunk += paragraph + '\n\n';
  }
  
  // Don't forget to add the last chunk if there's anything left
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `chunk-${chunks.length}`,
      content: currentChunk.trim()
    });
  }
  
  return chunks;
};
