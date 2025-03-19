
interface CrawlResponse {
  success: boolean;
  error?: string;
  data?: any;
}

interface CrawlOptions {
  limit?: number;
  formats?: string[];
  depth?: number;
  maxPagesToCrawl?: number;
}

export class FirecrawlService {
  /**
   * Calls the Supabase process-document edge function to process a document with Firecrawl or LlamaParse
   */
  static async processDocument(
    documentUrl: string,
    documentType: string,
    clientId: string,
    agentName: string,
    documentId: string,
    useLlamaParse: boolean = false
  ): Promise<CrawlResponse> {
    try {
      console.log(`Sending request to process document:`, {
        documentUrl,
        documentType,
        clientId,
        agentName,
        documentId,
        useLlamaParse
      });
      
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
          documentId,
          useLlamaParse,
          // Add crawl options for Firecrawl
          crawlOptions: {
            depth: 2, // Enable depth crawling
            maxPagesToCrawl: 100, // Increase page limit
            format: 'markdown' // Prefer markdown for better structure
          }
        }),
      });

      // Handle non-JSON responses first
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const rawText = await response.text();
        console.error('Received non-JSON response:', rawText.substring(0, 500));
        return {
          success: false,
          error: `Server returned non-JSON response: ${rawText.substring(0, 200)}...`,
        };
      }

      // If response is not OK, get the error text
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error processing document. Status:', response.status, 'Error:', errorText);
        
        try {
          // Try to parse the error as JSON
          const errorJson = JSON.parse(errorText);
          return {
            success: false,
            error: errorJson.error || `HTTP error ${response.status}`,
          };
        } catch (e) {
          // If parsing fails, return the raw error text
          return {
            success: false,
            error: `HTTP error ${response.status}: ${errorText}`,
          };
        }
      }

      // Parse the JSON response
      try {
        const data = await response.json();
        return {
          success: true,
          data
        };
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        return {
          success: false,
          error: 'Invalid JSON response from server',
        };
      }
    } catch (error) {
      console.error('Error in processDocument:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to processing API',
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

      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error getting processing status:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          return {
            success: false,
            error: errorJson.error || `HTTP error ${response.status}`,
          };
        } catch (e) {
          return {
            success: false,
            error: `HTTP error ${response.status}: ${errorText}`,
          };
        }
      }

      // Parse the JSON response
      try {
        const data = await response.json();
        return {
          success: true,
          data
        };
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        return {
          success: false,
          error: 'Invalid JSON response from server',
        };
      }
    } catch (error) {
      console.error('Error in getProcessingStatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get processing status',
      };
    }
  }
}
