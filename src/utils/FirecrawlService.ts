
import { supabase } from "@/integrations/supabase/client";

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
      
      // Call the Supabase Edge Function directly instead of using a relative API path
      const { data, error } = await supabase.functions.invoke('process-document', {
        method: 'POST',
        body: {
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
          },
          // Add parse options for LlamaParse
          parseOptions: {
            split_by: "chunk", 
            chunk_size: 2000,
            include_metadata: true
          }
        },
      });

      // Check for errors
      if (error) {
        console.error('Error calling process-document function:', error);
        return {
          success: false,
          error: `Error calling process-document: ${error.message || 'Unknown error'}`
        };
      }

      // If successful, return the data
      return {
        success: true,
        data
      };
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
      // Create a URLSearchParams object to properly encode the jobId
      const searchParams = new URLSearchParams({ jobId });
      
      // Call the Supabase Edge Function directly
      const { data, error } = await supabase.functions.invoke('document-processing-status', {
        method: 'GET',
        // Fix: Use correct approach to pass query parameters in FunctionInvokeOptions
        headers: {
          'x-search-params': searchParams.toString()
        }
      });

      // Check for errors
      if (error) {
        console.error('Error getting processing status:', error);
        return {
          success: false,
          error: `Error getting processing status: ${error.message || 'Unknown error'}`
        };
      }

      // If successful, return the data
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
