
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WebsiteUrl } from '@/types/website-url';
import { toast } from 'sonner';
import { FirecrawlService } from '@/services/FirecrawlService';

export const useStoreWebsiteContent = (clientId: string) => {
  return useMutation({
    mutationFn: async (website: WebsiteUrl) => {
      try {
        // Initialize FirecrawlService
        const firecrawlService = new FirecrawlService({
          apiKey: import.meta.env.VITE_FIRECRAWL_API_KEY || '',
          baseUrl: import.meta.env.VITE_FIRECRAWL_API_URL || 'https://api.firecrawl.dev/v1'
        });

        // First, check if the URL is scrapable
        console.log('Checking if URL is scrapable:', website.url);
        const scrapabilityCheck = await firecrawlService.checkScrapability(website.url);
        
        if (!scrapabilityCheck.success || !scrapabilityCheck.data) {
          console.error('URL is not scrapable:', scrapabilityCheck.error);
          
          // Update the website status to failed
          await supabase
            .from('website_urls')
            .update({
              status: 'failed',
              last_crawled: new Date().toISOString(),
              error: scrapabilityCheck.error || 'URL is not scrapable',
              scrapable: false
            })
            .eq('id', website.id);
            
          return { 
            success: false, 
            error: scrapabilityCheck.error || 'URL is not scrapable' 
          };
        }

        // Start the crawl
        console.log('Starting website crawl for:', website.url);
        const crawlResult = await firecrawlService.crawlWebsite({
          url: website.url,
          maxDepth: 3,
          limit: 100,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
            blockAds: true
          }
        });

        if (!crawlResult.success || !crawlResult.id) {
          console.error('Failed to start crawl:', crawlResult.error);
          
          // Update the website status to failed
          await supabase
            .from('website_urls')
            .update({
              status: 'failed',
              last_crawled: new Date().toISOString(),
              error: crawlResult.error || 'Failed to start crawl',
              scrapable: false
            })
            .eq('id', website.id);
            
          return { 
            success: false, 
            error: crawlResult.error || 'Failed to start crawl' 
          };
        }

        // Update website status to processing
        await supabase
          .from('website_urls')
          .update({
            status: 'processing',
            last_crawled: new Date().toISOString(),
            scrapable: true
          })
          .eq('id', website.id);

        // Poll for crawl status
        let status;
        let attempts = 0;
        const maxAttempts = 20; // More attempts for production
        
        do {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between checks
          console.log('Checking crawl status for job:', crawlResult.id);
          status = await firecrawlService.getCrawlStatus(crawlResult.id);
          console.log('Crawl status:', status.status, `(${status.completed}/${status.total})`);
          attempts++;
        } while (status.status === 'scraping' && attempts < maxAttempts);

        if (status.status === 'completed') {
          // Get the crawl results
          const results = await firecrawlService.getCrawlResults(crawlResult.id);
          
          // Process and store the content
          let combinedContent = '';
          
          if (results.data && results.data.length > 0) {
            // Combine all markdown content from the results
            combinedContent = results.data
              .map(item => {
                if (item.markdown) {
                  return `# ${item.metadata.title || 'Untitled'}\n\n${item.markdown}`;
                }
                return '';
              })
              .join('\n\n---\n\n');
          }
          
          // Update the website with the extracted content
          await supabase
            .from('website_urls')
            .update({
              status: 'completed',
              last_crawled: new Date().toISOString(),
              content: combinedContent,
              scrapable: true,
              scrapability: 'high',
              total_pages: results.total,
              completed_pages: results.completed,
              credits_used: results.creditsUsed,
              expires_at: results.expiresAt,
              error: null
            })
            .eq('id', website.id);
            
          return { success: true };
        } else {
          // Update the website status to failed
          await supabase
            .from('website_urls')
            .update({
              status: 'failed',
              last_crawled: new Date().toISOString(),
              error: `Crawl ${status.status}: ${attempts >= maxAttempts ? 'Timeout exceeded' : 'Processing failed'}`,
              scrapable: true,
              scrapability: 'medium'
            })
            .eq('id', website.id);
            
          return { 
            success: false, 
            error: `Crawl ${status.status}: ${attempts >= maxAttempts ? 'Timeout exceeded' : 'Processing failed'}` 
          };
        }
      } catch (error) {
        console.error('Error storing website content:', error);
        
        // Update the website status to failed
        await supabase
          .from('website_urls')
          .update({
            status: 'failed',
            last_crawled: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', website.id);
          
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    },
    onSuccess: () => {
      toast.success('Website content stored successfully');
    },
    onError: (error) => {
      toast.error(`Failed to store website content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
};
