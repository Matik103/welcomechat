
import { DocumentChunk } from '@/types/document-processing';
import { v4 as uuidv4 } from 'uuid';
import { ValidationResult } from '@/types/document-processing';

/**
 * Validates a document link URL
 */
export function validateDocumentLink(url: string): ValidationResult {
  if (!url) {
    return {
      isValid: false,
      errors: ['URL is required']
    };
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch (e) {
    return {
      isValid: false,
      errors: ['Invalid URL format']
    };
  }

  // Check if it's a Google Drive link
  const isGoogleDrive = url.includes('drive.google.com') || 
                        url.includes('docs.google.com') || 
                        url.includes('sheets.google.com') || 
                        url.includes('slides.google.com');
  
  // Check if it's a direct file link
  const isPDF = url.toLowerCase().endsWith('.pdf');
  const isDocx = url.toLowerCase().endsWith('.docx');
  const isTxt = url.toLowerCase().endsWith('.txt');
  const isFile = isPDF || isDocx || isTxt;

  // If it's neither a Google Drive link nor a direct file, warn the user
  if (!isGoogleDrive && !isFile) {
    return {
      isValid: true,
      errors: ['URL may not be a supported document link. Supported formats include Google Drive links and direct file links (.pdf, .docx, .txt).'],
      status: 'warning'
    };
  }

  return {
    isValid: true,
    errors: [],
    status: 'success'
  };
}

/**
 * Splits long text into smaller chunks for better processing
 */
export function splitTextIntoChunks(text: string, maxChunkSize: number = 4000): DocumentChunk[] {
  if (!text) return [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: DocumentChunk[] = [];
  let currentChunk = '';
  let currentMetadata = {
    format: 'text',
    job_id: uuidv4(),
    chunk_index: 0
  };
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the max size, save current chunk and start a new one
    if (currentChunk.length + paragraph.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { ...currentMetadata }
      });
      
      currentChunk = '';
      currentMetadata.chunk_index += 1;
    }
    
    // If the paragraph itself is too long, split it into sentences
    if (paragraph.length > maxChunkSize) {
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length + 1 > maxChunkSize && currentChunk.length > 0) {
          chunks.push({
            content: currentChunk.trim(),
            metadata: { ...currentMetadata }
          });
          
          currentChunk = '';
          currentMetadata.chunk_index += 1;
        }
        
        // If even a single sentence is too long, force split it
        if (sentence.length > maxChunkSize) {
          const words = sentence.split(' ');
          let wordChunk = '';
          
          for (const word of words) {
            if (wordChunk.length + word.length + 1 > maxChunkSize && wordChunk.length > 0) {
              chunks.push({
                content: wordChunk.trim(),
                metadata: { ...currentMetadata }
              });
              
              wordChunk = '';
              currentMetadata.chunk_index += 1;
            }
            
            wordChunk += (wordChunk ? ' ' : '') + word;
          }
          
          if (wordChunk) {
            currentChunk += (currentChunk ? ' ' : '') + wordChunk;
          }
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  // Add the last chunk if there's content
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: { ...currentMetadata }
    });
  }
  
  return chunks;
}

/**
 * Process Markdown document content
 */
export function processMarkdownContent(content: string): DocumentChunk[] {
  // For markdown, we'll preserve the format but still split into manageable chunks
  return splitTextIntoChunks(content, 4000);
}

/**
 * Process PDF document content
 */
export function processPdfContent(content: string): DocumentChunk[] {
  // This is a simplified implementation - in reality, you might use a PDF parsing library
  return splitTextIntoChunks(content, 4000);
}

/**
 * Process generic document content
 */
export function processDocumentContent(content: string, documentType: string): DocumentChunk[] {
  switch(documentType.toLowerCase()) {
    case 'markdown':
    case 'md':
      return processMarkdownContent(content);
    case 'pdf':
      return processPdfContent(content);
    default:
      // Default to simple text chunking
      return splitTextIntoChunks(content);
  }
}
