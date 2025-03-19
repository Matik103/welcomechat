
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
      // This will be handled by the edge function with the API key
      const response = await fetch('/api/process-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentUrl,
          documentType,
          useLlamaParse: true
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error parsing document with LlamaCloud:', data);
        return {
          success: false,
          error: data.error || 'Failed to parse document with LlamaCloud',
        };
      }

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
