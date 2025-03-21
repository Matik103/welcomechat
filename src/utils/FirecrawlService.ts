
import { supabase } from "@/integrations/supabase/client";

interface CrawlOptions {
  limit?: number;
  maxDepth?: number;
  allowBackwardLinks?: boolean;
  allowExternalLinks?: boolean;
  scrapeOptions?: {
    formats?: string[];
    onlyMainContent?: boolean;
    includeTags?: string[];
    excludeTags?: string[];
    waitFor?: number;
    timeout?: number;
  };
}

interface CrawlResponse {
  success: boolean;
  error?: string;
  data?: any;
  id?: string;
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
    documentId: string,
    options: CrawlOptions = {}
  ): Promise<CrawlResponse> {
    try {
      console.log(`Sending request to process document:`, {
        documentUrl,
        documentType,
        clientId,
        agentName,
        documentId,
        options
      });
      
      // Define default options if not provided
      const defaultOptions: CrawlOptions = {
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
      };
      
      // Merge default options with provided options
      const crawlOptions = {
        ...defaultOptions,
        ...options,
        scrapeOptions: {
          ...defaultOptions.scrapeOptions,
          ...options.scrapeOptions
        }
      };

      // Call the Supabase Edge Function directly
      const { data, error } = await supabase.functions.invoke('process-document', {
        method: 'POST',
        body: {
          documentUrl,
          documentType,
          clientId,
          agentName,
          documentId,
          crawlOptions
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
   * Check the status of an ongoing crawl job
   */
  static async checkCrawlStatus(jobId: string): Promise<CrawlResponse> {
    try {
      console.log(`Checking status of crawl job: ${jobId}`);
      
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
      console.error('Error in checkCrawlStatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get processing status',
      };
    }
  }
  
  /**
   * Directly crawl a URL using the Firecrawl API
   * This method can be used for testing or development
   */
  static async crawlWebsite(url: string, options: CrawlOptions = {}): Promise<CrawlResponse> {
    try {
      console.log(`Crawling website: ${url}`);
      
      const { data, error } = await supabase.functions.invoke('crawl-website', {
        method: 'POST',
        body: { 
          url,
          options
        }
      });
      
      if (error) {
        console.error('Error crawling website:', error);
        return {
          success: false,
          error: error.message || 'Unknown error occurred while crawling'
        };
      }
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error in crawlWebsite:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to crawl website',
      };
    }
  }

  /**
   * Scrape a single URL using the Firecrawl API
   */
  static async scrapeUrl(url: string, options: any = {}): Promise<CrawlResponse> {
    try {
      console.log(`Scraping URL: ${url}`);
      
      const { data, error } = await supabase.functions.invoke('scrape-url', {
        method: 'POST',
        body: { 
          url,
          options
        }
      });
      
      if (error) {
        console.error('Error scraping URL:', error);
        return {
          success: false,
          error: error.message || 'Unknown error occurred while scraping'
        };
      }
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error in scrapeUrl:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape URL',
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

  /**
   * Validate a URL before adding it to the database
   * This performs basic validation before attempting to scrape
   */
  static validateUrl(url: string): { isValid: boolean; error?: string } {
    try {
      // Check if the URL is empty
      if (!url || url.trim() === '') {
        return { isValid: false, error: 'URL cannot be empty' };
      }
      
      // Try to create a URL object to validate the format
      const urlObj = new URL(url);
      
      // Check the protocol
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
      }
      
      // Check that hostname exists
      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        return { isValid: false, error: 'Invalid hostname in URL' };
      }
      
      return { isValid: true };
    } catch (error) {
      // If URL constructor throws an error, the URL is invalid
      return { 
        isValid: false, 
        error: 'Invalid URL format. Please enter a complete URL including http:// or https://'
      };
    }
  }
}
