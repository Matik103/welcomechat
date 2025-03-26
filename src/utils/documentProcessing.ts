
import { v4 as uuidv4 } from 'uuid';
import { DocumentChunk, ValidationResult } from '@/types/document-processing';

/**
 * Validates content for processing
 * @param content Content to validate
 * @returns Validation result with status and message
 */
export const validateContent = (content: string): ValidationResult => {
  // Check if content is empty
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      message: 'Content is empty',
      error: 'Empty content cannot be processed',
      status: 'error'
    };
  }

  // Check if content is too short (less than 50 characters)
  if (content.length < 50) {
    return {
      isValid: false,
      message: 'Content is too short',
      error: 'Content must be at least 50 characters',
      status: 'warning'
    };
  }

  // Calculate token estimate (rough approximation: 4 chars = 1 token)
  const estimatedTokens = Math.ceil(content.length / 4);
  
  // Warn if content might be too large (OpenAI has limits)
  if (estimatedTokens > 100000) {
    return {
      isValid: true,
      message: 'Content is very large, processing may take longer',
      details: {
        estimatedTokens,
        pageSize: `${(content.length / 1024).toFixed(2)} KB`
      },
      status: 'warning'
    };
  }

  // Content looks good
  return {
    isValid: true,
    message: 'Content validated successfully',
    details: {
      estimatedTokens,
      pageSize: `${(content.length / 1024).toFixed(2)} KB`
    },
    status: 'success'
  };
};

/**
 * Chunks document content into manageable pieces
 * @param content Full document content
 * @param chunkSize Size of each chunk (default: 8000 characters)
 * @param overlap Overlap between chunks (default: 200 characters)
 * @returns Array of document chunks with metadata
 */
export const chunkContent = async (
  content: string,
  chunkSize = 8000,
  overlap = 200
): Promise<DocumentChunk[]> => {
  const chunks: DocumentChunk[] = [];
  
  let position = 0;
  let chunkIndex = 0;
  const totalChunks = Math.ceil(content.length / (chunkSize - overlap));
  
  while (position < content.length) {
    const end = Math.min(position + chunkSize, content.length);
    const chunkContent = content.slice(position, end);
    
    chunks.push({
      id: uuidv4(),
      content: chunkContent,
      length: chunkContent.length,
      metadata: {
        chunk_index: chunkIndex,
        total_chunks: totalChunks,
        start_position: position,
        end_position: end
      }
    });
    
    // Move position for next chunk, accounting for overlap
    position = end - overlap > position ? end - overlap : end;
    chunkIndex++;
  }
  
  return chunks;
};

/**
 * Extracts key information from document content
 * This is a simplified implementation - in a real application,
 * you might use more sophisticated NLP techniques
 * @param content Document content
 * @returns Extracted metadata
 */
export const extractDocumentMetadata = (content: string): Record<string, any> => {
  const metadata: Record<string, any> = {};
  
  // Try to extract title (first non-empty line or first heading)
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    // Look for headings (markdown or plain text)
    const headingMatch = content.match(/#+\s+(.+?)(?:\n|$)/);
    if (headingMatch && headingMatch[1]) {
      metadata.title = headingMatch[1].trim();
    } else {
      metadata.title = lines[0].trim();
    }
  }
  
  // Estimate reading time (average reading speed: 200 words per minute)
  const wordCount = content.split(/\s+/).length;
  metadata.wordCount = wordCount;
  metadata.readingTime = Math.ceil(wordCount / 200);
  
  // Try to detect language (simple heuristic)
  metadata.language = detectLanguage(content);
  
  return metadata;
};

/**
 * Simple language detection based on common words
 * This is a basic implementation - in a real application,
 * you would use a proper language detection library
 * @param content Text content
 * @returns Detected language code
 */
const detectLanguage = (content: string): string => {
  const sample = content.slice(0, 1000).toLowerCase();
  
  // Count occurrences of common words in different languages
  const englishWords = ['the', 'and', 'or', 'is', 'are', 'in', 'to', 'with', 'for'];
  const spanishWords = ['el', 'la', 'los', 'las', 'y', 'o', 'es', 'en', 'con', 'por'];
  const frenchWords = ['le', 'la', 'les', 'et', 'ou', 'est', 'sont', 'dans', 'avec', 'pour'];
  
  const countWords = (words: string[]): number => {
    return words.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = sample.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  };
  
  const englishCount = countWords(englishWords);
  const spanishCount = countWords(spanishWords);
  const frenchCount = countWords(frenchWords);
  
  // Find the language with the highest count
  if (englishCount > spanishCount && englishCount > frenchCount) {
    return 'en';
  } else if (spanishCount > englishCount && spanishCount > frenchCount) {
    return 'es';
  } else if (frenchCount > englishCount && frenchCount > spanishCount) {
    return 'fr';
  } else {
    return 'en'; // Default to English
  }
};
