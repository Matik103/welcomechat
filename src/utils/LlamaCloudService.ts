
interface ParseResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export class LlamaCloudService {
  static async parseDocument(
    documentUrl: string,
    documentType: string
  ): Promise<ParseResponse> {
    try {
      console.log(`LlamaParse: Starting document parsing for ${documentType} at ${documentUrl}`);
      
      // This will be handled by the edge function with the API key
      const response = await fetch('/api/process-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentUrl,
          documentType,
          useLlamaParse: true,
          parseOptions: {
            // Add LlamaParse specific options
            split_by: "chunk", // Split by chunks for better segmentation
            chunk_size: 2000, // Optimal chunk size for OpenAI models
            include_metadata: true // Include document metadata
          }
        }),
      });

      // Handle non-JSON responses first
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const rawText = await response.text();
        console.error('Received non-JSON response from LlamaParse:', rawText.substring(0, 500));
        return {
          success: false,
          error: `LlamaParse returned non-JSON response: ${rawText.substring(0, 200)}...`,
        };
      }

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error parsing document with LlamaCloud:', data);
        return {
          success: false,
          error: data.error || 'Failed to parse document with LlamaCloud',
        };
      }

      console.log('LlamaParse: Successfully parsed document, content length:', 
        data.content ? data.content.length : 'unknown');
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error in parseDocument:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to LlamaCloud API',
      };
    }
  }
}
