
import { useMutation } from '@tanstack/react-query';
import { WebsiteUrl } from '@/types/website-url';
import { FirecrawlService } from '@/services/FirecrawlService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStoreWebsiteContent = (clientId: string) => {
  const firecrawlService = new FirecrawlService({
    apiKey: import.meta.env.VITE_FIRECRAWL_API_KEY || '',
    baseUrl: import.meta.env.VITE_FIRECRAWL_API_URL || 'https://api.firecrawl.dev/v1'
  });

  return useMutation({
    mutationFn: async (website: WebsiteUrl) => {
      if (!website.url || !website.id) {
        throw new Error('Website URL and ID are required');
      }

      if (!clientId) {
        throw new Error('Client ID is required');
      }

      console.log(`Processing website URL: ${website.url} (ID: ${website.id})`);

      // Update status to processing
      await supabase
        .from('website_urls')
        .update({ status: 'processing', last_processed: new Date().toISOString() })
        .eq('id', website.id);

      // Check if URL is scrapable
      const scrapabilityResult = await firecrawlService.checkScrapability(website.url);
      
      if (!scrapabilityResult.success || !scrapabilityResult.data) {
        console.error('Scrapability check failed:', scrapabilityResult.error);
        
        await supabase
          .from('website_urls')
          .update({ 
            status: 'failed', 
            scrapable: false, 
            error_message: scrapabilityResult.error || 'Scrapability check failed'
          })
          .eq('id', website.id);
        
        throw new Error(`URL is not scrapable: ${scrapabilityResult.error || 'Unknown error'}`);
      }

      const { scrapability } = scrapabilityResult.data;
      
      // Update scrapability info
      await supabase
        .from('website_urls')
        .update({ 
          scrapable: true, 
          scrapability: scrapability || 'unknown'
        })
        .eq('id', website.id);

      // Start crawling the website
      const crawlOptions = {
        url: website.url,
        maxDepth: 2,
        limit: 20,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
          blockAds: true
        }
      };

      const crawlResult = await firecrawlService.crawlWebsite(crawlOptions);
      
      if (!crawlResult.success || !crawlResult.id) {
        console.error('Failed to start crawl:', crawlResult.error);
        
        await supabase
          .from('website_urls')
          .update({ 
            status: 'failed', 
            error_message: crawlResult.error || 'Failed to start crawl'
          })
          .eq('id', website.id);
        
        throw new Error(`Failed to start website crawl: ${crawlResult.error || 'Unknown error'}`);
      }

      const crawlId = crawlResult.id;
      console.log(`Crawl started with ID: ${crawlId}`);

      // Poll for completion
      let status;
      let attempts = 0;
      const maxAttempts = 15; // Increased from 10 for larger sites
      const pollingInterval = 3000; // 3 seconds

      do {
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        status = await firecrawlService.getCrawlStatus(crawlId);
        console.log(`Crawl status (attempt ${attempts + 1}/${maxAttempts}):`, status);
        attempts++;
      } while (status.status === 'scraping' && attempts < maxAttempts);

      if (status.status !== 'completed') {
        // Update with partial completion or failure
        const statusToStore = status.status === 'scraping' ? 'partial' : 'failed';
        
        await supabase
          .from('website_urls')
          .update({ 
            status: statusToStore, 
            error_message: status.status === 'scraping' 
              ? 'Crawl still in progress, check back later' 
              : (status.error || 'Crawl failed')
          })
          .eq('id', website.id);
        
        if (status.status === 'scraping') {
          toast.warning('Crawl is taking longer than expected. It will continue in the background.');
          return { status: 'partial', message: 'Crawl is still in progress' };
        }
        
        throw new Error(`Crawl did not complete: ${status.status}`);
      }

      // Get the results
      const results = await firecrawlService.getCrawlResults(crawlId);
      console.log('Crawl results:', results);

      // Store the results in the database
      const { error } = await supabase
        .from('website_urls')
        .update({
          status: 'completed',
          last_crawled: new Date().toISOString(),
          total_pages: results.total,
          completed_pages: results.completed,
          credits_used: results.creditsUsed,
          crawl_id: crawlId,
          error_message: null
        })
        .eq('id', website.id);

      if (error) {
        console.error('Failed to update database with crawl results:', error);
        throw new Error(`Failed to update database: ${error.message}`);
      }

      console.log(`Successfully processed website URL: ${website.url}`);
      return { status: 'completed', results };
    },
    onError: (error) => {
      console.error('Error in useStoreWebsiteContent:', error);
      toast.error(`Failed to process website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
    onSuccess: (data) => {
      console.log('Successfully processed website:', data);
      toast.success('Website successfully processed!');
    }
  });
};
