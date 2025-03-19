
interface CrawlResponse {
  success: boolean;
  error?: string;
  data?: any;
}

interface CrawlOptions {
  limit?: number;
  formats?: string[];
}

export class FirecrawlService {
  /**
   * Calls the Supabase process-document edge function to process a document with Firecrawl
   */
  static async processDocument(
    documentUrl: string,
    documentType: string,
    clientId: string,
    agentName: string,
    documentId: string
  ): Promise<CrawlResponse> {
    try {
      const response = await fetch('/api/process-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentUrl,
          documentType,
          clientId,
          agentName,
          documentId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error processing document:', data);
        return {
          success: false,
          error: data.error || 'Failed to process document',
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error in processDocument:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API',
      };
    }
  }

  /**
   * Get the status of a document processing job
   */
  static async getProcessingStatus(jobId: string): Promise<CrawlResponse> {
    try {
      // This would call another edge function to check the status in the database
      const response = await fetch(`/api/document-processing-status?jobId=${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error getting processing status:', data);
        return {
          success: false,
          error: data.error || 'Failed to get processing status',
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error in getProcessingStatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get processing status',
      };
    }
  }
}
