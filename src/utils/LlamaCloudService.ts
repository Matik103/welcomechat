
/**
 * LlamaCloudService.ts - Service for interacting with LlamaCloud API for document parsing
 */

export interface ParseResponse {
  success: boolean;
  content?: string;
  metadata?: any;
  error?: string;
  errorDetails?: any;
}

export class LlamaParseError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'LlamaParseError';
    this.code = code;
    this.details = details;
  }
}

export class LlamaCloudService {
  private static LLAMA_CLOUD_API_KEY = import.meta.env.VITE_LLAMA_CLOUD_API_KEY || '';

  /**
   * Gets a public URL for a document stored in Supabase
   * @param documentPath The path to the document in the storage bucket
   * @returns A URL that can be accessed by LlamaParse
   */
  private static async getPublicUrl(documentPath: string): Promise<string> {
    try {
      // Import dynamically to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Extract bucket and file path from the document path
      // The format is typically 'bucket/filePath'
      let bucketName = 'Document Storage'; // Default bucket
      let filePath = documentPath;
      
      if (documentPath.includes('/')) {
        const pathParts = documentPath.split('/');
        if (pathParts.length > 1 && pathParts[0] !== 'Document Storage') {
          filePath = documentPath; // Keep the full path for the file
        }
      }
      
      // Get public URL or signed URL depending on bucket privacy settings
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      
      if (!data?.publicUrl) {
        throw new LlamaParseError(
          'Failed to generate public URL for document',
          'STORAGE_URL_ERROR'
        );
      }
      
      console.log(`Generated public URL for document: ${data.publicUrl}`);
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', error);
      throw new LlamaParseError(
        `Failed to get public URL: ${error instanceof Error ? error.message : String(error)}`,
        'STORAGE_ACCESS_ERROR',
        { documentPath }
      );
    }
  }
  
  /**
   * Parse a document using the LlamaCloud API
   * @param documentUrl The URL or path to the document
   * @param fileType The MIME type of the document
   * @param clientId The client ID for logging (optional)
   * @param agentName The agent name for logging (optional)
   * @returns A response containing the parsed content or error
   */
  static async parseDocument(
    documentUrl: string, 
    fileType: string = 'application/pdf',
    clientId?: string,
    agentName?: string
  ): Promise<ParseResponse> {
    try {
      console.log(`Starting document parsing for ${documentUrl}`);
      
      // If documentUrl doesn't start with http or https, it's likely a storage path
      // so get the public URL for it
      let accessibleUrl = documentUrl;
      if (!documentUrl.startsWith('http://') && !documentUrl.startsWith('https://')) {
        console.log(`Getting public URL for document path: ${documentUrl}`);
        accessibleUrl = await this.getPublicUrl(documentUrl);
      }
      
      // Verify the API key is available
      if (!this.LLAMA_CLOUD_API_KEY) {
        console.error('LlamaCloud API key is not configured');
        return {
          success: false,
          error: 'LlamaCloud API key is not configured',
          errorDetails: { code: 'API_KEY_MISSING' }
        };
      }
      
      // Standardize file type for LlamaParse API
      // LlamaParse expects types like 'pdf', 'txt', etc.
      const standardizedFileType = this.standardizeFileType(fileType);
      
      console.log(`Parsing document using LlamaParse: URL=${accessibleUrl}, type=${standardizedFileType}`);
      
      // Step 1: Upload document to LlamaParse
      console.log(`Uploading document to LlamaParse with type: ${standardizedFileType}`);
      const uploadResponse = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.LLAMA_CLOUD_API_KEY}`
        },
        body: JSON.stringify({
          file_url: accessibleUrl,
          file_type: standardizedFileType
        })
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`LlamaParse upload failed: ${errorText}`);
        return {
          success: false,
          error: `LlamaParse upload failed with status ${uploadResponse.status}`,
          errorDetails: { response: errorText, code: 'LLAMAPARSE_UPLOAD_ERROR' }
        };
      }
      
      const uploadData = await uploadResponse.json();
      const documentId = uploadData.id;
      
      if (!documentId) {
        console.error('LlamaParse upload did not return a document ID', uploadData);
        return {
          success: false,
          error: 'LlamaParse upload did not return a document ID',
          errorDetails: { response: uploadData, code: 'LLAMAPARSE_INVALID_RESPONSE' }
        };
      }
      
      console.log(`Document uploaded to LlamaParse with ID: ${documentId}`);
      
      // Step 2: Wait for parsing to complete and retrieve the result
      let parseResult;
      let attempts = 0;
      const MAX_ATTEMPTS = 20; // Increase timeout for larger documents
      
      while (attempts < MAX_ATTEMPTS) {
        console.log(`Checking parse status (attempt ${attempts + 1}/${MAX_ATTEMPTS})...`);
        
        const statusResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/${documentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.LLAMA_CLOUD_API_KEY}`
          }
        });
        
        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error(`Error checking parse status: ${errorText}`);
          attempts++;
          
          if (attempts >= MAX_ATTEMPTS) {
            return {
              success: false,
              error: `Failed to check parse status after ${MAX_ATTEMPTS} attempts`,
              errorDetails: { 
                documentId, 
                lastResponse: errorText, 
                code: 'LLAMAPARSE_STATUS_ERROR' 
              }
            };
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        
        parseResult = await statusResponse.json();
        
        // Check the status of the parsing
        if (parseResult.status === 'processed') {
          console.log('Document parsing completed successfully');
          break;
        } else if (parseResult.status === 'failed') {
          console.error('Document parsing failed', parseResult);
          return {
            success: false,
            error: 'Document parsing failed',
            errorDetails: { response: parseResult, code: 'LLAMAPARSE_PROCESSING_FAILED' }
          };
        }
        
        // If still processing, wait and try again
        console.log(`Document still processing (status: ${parseResult.status}), waiting...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
      }
      
      if (attempts >= MAX_ATTEMPTS) {
        console.error('Document parsing timed out');
        return {
          success: false,
          error: 'Document parsing timed out',
          errorDetails: { documentId, code: 'LLAMAPARSE_TIMEOUT' }
        };
      }
      
      // Step 3: Extract the document content
      if (!parseResult || !parseResult.results || parseResult.results.length === 0) {
        console.error('No parsing results found', parseResult);
        return {
          success: false,
          error: 'No parsing results found',
          errorDetails: { response: parseResult, code: 'LLAMAPARSE_EMPTY_RESULT' }
        };
      }
      
      // Extract the text content from the results
      const content = parseResult.results.map((chunk: any) => chunk.text).join('\n\n');
      
      // Extract metadata from the results
      const metadata = {
        title: parseResult.metadata?.title || '',
        author: parseResult.metadata?.author || '',
        createdAt: parseResult.metadata?.created_at || '',
        pageCount: parseResult.metadata?.page_count || 0,
        language: parseResult.metadata?.language || 'en',
        processingMethod: 'llamaparse',
        processedAt: new Date().toISOString(),
        llamaparseId: documentId,
        documentUrl: accessibleUrl,
        clientId,
        agentName
      };
      
      console.log(`Document parsed successfully with ${content.length} characters`);
      
      return {
        success: true,
        content,
        metadata
      };
    } catch (error) {
      console.error('Error in LlamaCloudService.parseDocument:', error);
      const isLlamaParseError = error instanceof LlamaParseError;
      return {
        success: false,
        error: `Error parsing document: ${error instanceof Error ? error.message : String(error)}`,
        errorDetails: {
          code: isLlamaParseError ? (error as LlamaParseError).code : 'UNEXPECTED_ERROR',
          details: isLlamaParseError ? (error as LlamaParseError).details : undefined
        }
      };
    }
  }
  
  /**
   * Standardize file type for LlamaParse API
   * @param fileType The MIME type or file extension
   * @returns A standardized file type
   */
  private static standardizeFileType(fileType: string): string {
    // If file type is already just an extension (pdf, txt, etc.), return it
    if (/^[a-z0-9]+$/.test(fileType.toLowerCase())) {
      return fileType.toLowerCase();
    }
    
    // Handle MIME types
    if (fileType.includes('/')) {
      const mimeType = fileType.toLowerCase();
      
      // Map common MIME types to expected LlamaParse formats
      if (mimeType.includes('pdf')) return 'pdf';
      if (mimeType.includes('text/plain')) return 'txt';
      if (mimeType.includes('text/csv') || mimeType.includes('csv')) return 'csv';
      if (mimeType.includes('word') || mimeType.includes('docx') || mimeType.includes('doc')) return 'docx';
      if (mimeType.includes('excel') || mimeType.includes('xlsx') || mimeType.includes('xls')) return 'xlsx';
      if (mimeType.includes('powerpoint') || mimeType.includes('pptx') || mimeType.includes('ppt')) return 'pptx';
      if (mimeType.includes('html')) return 'html';
      if (mimeType.includes('markdown') || mimeType.includes('md')) return 'md';
      if (mimeType.includes('json')) return 'json';
    }
    
    // For file paths, extract extension
    if (fileType.includes('.')) {
      const extension = fileType.split('.').pop()?.toLowerCase();
      if (extension) return extension;
    }
    
    // Default to pdf if we can't determine the type
    console.warn(`Could not determine standardized file type for: ${fileType}, defaulting to pdf`);
    return 'pdf';
  }
}
