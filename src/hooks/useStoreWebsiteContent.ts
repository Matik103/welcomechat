
import { useState } from 'react';
import { FirecrawlService } from '@/services/FirecrawlService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WebsiteUrlFormData } from '@/types/website-url';

export function useStoreWebsiteContent(clientId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlStatus, setCrawlStatus] = useState<string | null>(null);
  const { toast } = useToast();

  // Validate URL before processing
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Check if the URL is allowed to be scraped
  const checkUrlAccessibility = async (url: string) => {
    try {
      setIsLoading(true);
      
      // Use the static method
      const result = await FirecrawlService.checkScrapability(url);
      
      if (!result.isAccessible) {
        toast({
          title: 'URL is not accessible',
          description: result.error || 'The URL cannot be accessed. Please check if it is public and correctly formatted.',
          variant: 'destructive',
        });
        return false;
      }

      if (!result.canScrape) {
        toast({
          title: 'URL cannot be scraped',
          description: result.error || 'The website has restrictions preventing scraping.',
          variant: 'destructive',
        });
        return false;
      }

      return true;
    } catch (error) {
      toast({
        title: 'Error checking URL',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Process the website using Firecrawl
  const processWebsite = async (formData: WebsiteUrlFormData) => {
    if (!clientId) {
      toast({
        title: 'Client not found',
        description: 'Client ID is required to process the website',
        variant: 'destructive',
      });
      return false;
    }

    if (!validateUrl(formData.url)) {
      return false;
    }

    const urlAccessible = await checkUrlAccessibility(formData.url);
    if (!urlAccessible) {
      return false;
    }

    try {
      setIsLoading(true);
      setCrawlStatus('starting');
      setProgress(0);

      // Start the crawl process
      const response = await FirecrawlService.processWebsite({
        url: formData.url,
        maxDepth: formData.maxDepth || 2,
        limit: formData.limit || 100,
        scrapeOptions: {
          onlyMainContent: true,
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to start website processing');
      }

      const jobId = response.id;
      if (!jobId) {
        throw new Error('No job ID returned from crawl service');
      }

      // Add entry to website_urls table
      const { error: insertError } = await supabase
        .from('website_urls')
        .insert({
          client_id: clientId,
          url: formData.url,
          status: 'processing',
          processing_job_id: jobId,
          limit: formData.limit || 100,
          max_depth: formData.maxDepth || 2,
          is_sitemap: formData.isSitemap || false
        });

      if (insertError) {
        throw insertError;
      }

      // Poll for status until complete
      await pollCrawlStatus(jobId);

      // Get and store results
      const resultsResponse = await FirecrawlService.getCrawlResults(jobId);
      
      if (!resultsResponse.success) {
        throw new Error(resultsResponse.error || 'Failed to retrieve results');
      }
      
      const results = resultsResponse.data;
      
      // Update website_urls with results
      await supabase
        .from('website_urls')
        .update({
          status: 'completed',
          pages_crawled: results.total || 0,
          pages_stored: results.completed || 0,
          credits_used: results.creditsUsed || 0,
          last_crawled: new Date().toISOString()
        })
        .eq('processing_job_id', jobId);

      toast({
        title: 'Website Processing Complete',
        description: `Successfully processed ${results.completed} pages from ${formData.url}`,
      });
      
      return true;
    } catch (error) {
      // Update status to failed if there was an error
      if (clientId) {
        await supabase
          .from('website_urls')
          .update({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error during processing'
          })
          .eq('client_id', clientId)
          .eq('url', formData.url);
      }
      
      toast({
        title: 'Website Processing Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsLoading(false);
      setCrawlStatus(null);
      setProgress(0);
    }
  };

  // Poll the crawl status until complete
  const pollCrawlStatus = async (jobId: string) => {
    return new Promise<void>((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const response = await FirecrawlService.checkCrawlStatus(jobId);
          
          if (!response.success) {
            reject(new Error(response.error || 'Failed to check crawl status'));
            return;
          }
          
          const status = response.status || 'processing';
          setCrawlStatus(status);
          
          if (response.data && response.data.progress) {
            const { discovered, crawled } = response.data.progress;
            const progressValue = discovered > 0 ? Math.round((crawled / discovered) * 100) : 0;
            setProgress(progressValue);
          }
          
          if (status === 'completed' || status === 'failed') {
            resolve();
          } else {
            setTimeout(checkStatus, 2000);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      checkStatus();
    });
  };

  return {
    processWebsite,
    isLoading,
    progress,
    crawlStatus
  };
}
