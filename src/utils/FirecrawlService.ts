
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
  allowExternalLinks?: boolean;
  allowBackwardLinks?: boolean;
  scrapeOptions?: {
    formats?: string[];
    onlyMainContent?: boolean;
    includeTags?: string[];
    excludeTags?: string[];
    waitFor?: number;
    timeout?: number;
  };
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
      console.log(`Sending request to process document:`, {
        documentUrl,
        documentType,
        clientId,
        agentName,
        documentId
      });
      
      // Call the Supabase Edge Function directly
      const { data, error } = await supabase.functions.invoke('process-document', {
        method: 'POST',
        body: {
          documentUrl,
          documentType,
          clientId,
          agentName,
          documentId,
          // Add optimized crawl options based on Firecrawl docs
          crawlOptions: {
            maxDepth: 3,
            limit: 50,
            allowBackwardLinks: true,
            allowExternalLinks: false,
            scrapeOptions: {
              formats: ["markdown"],
              onlyMainContent: true, 
              includeTags: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "article", "main", "section"],
              excludeTags: ["nav", "footer", "header", "aside", "script", "style", "button", ".cookie-banner", ".popup", ".modal", ".advertisement", ".social-share", ".newsletter-signup"],
              waitFor: 1000,
              timeout: 30000
            }
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
  
  /**
   * Verify Firecrawl API key and configuration
   */
  static async verifyFirecrawlConfig(): Promise<CrawlResponse> {
    try {
      console.log('Verifying Firecrawl configuration...');
      
      // Check that the FIRECRAWL_API_KEY is set
      const { data: secretsData, error: secretsError } = await supabase.functions.invoke('check-secrets', {
        method: 'POST',
        body: { 
          required: ['FIRECRAWL_API_KEY'] 
        },
      });
      
      if (secretsError || !secretsData?.success) {
        return {
          success: false,
          error: 'Missing Firecrawl API key'
        };
      }
      
      return {
        success: true,
        data: {
          message: 'Firecrawl API key is configured properly',
          configured: true
        }
      };
    } catch (error) {
      console.error('Error verifying Firecrawl configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify Firecrawl configuration'
      };
    }
  }
}
