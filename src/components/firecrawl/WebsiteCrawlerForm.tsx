
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { FirecrawlService } from '@/services/FirecrawlService';
import { Loader2 } from 'lucide-react';

export function WebsiteCrawlerForm() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  const handleCrawlWebsite = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate URL
    const urlValidation = FirecrawlService.validateUrl(url);
    if (!urlValidation.isValid) {
      toast.error(`Invalid URL: ${urlValidation.error}`);
      return;
    }

    // Check if Firecrawl is configured
    const configCheck = await FirecrawlService.verifyFirecrawlConfig();
    if (!configCheck.success) {
      toast.error('Firecrawl API key is not configured. Please configure it first.');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setResult(null);

    try {
      // First check if the URL is scrapable
      setProgress(20);
      toast.info('Checking if the URL is scrapable...');
      
      const scrapabilityResult = await FirecrawlService.checkScrapability(url);
      if (!scrapabilityResult.success) {
        throw new Error(`URL is not scrapable: ${scrapabilityResult.error || 'Unknown error'}`);
      }

      setProgress(40);
      toast.info('Starting website crawl...');

      // Crawl the website
      const crawlOptions = {
        url,
        maxDepth: 2,
        limit: 20,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
          blockAds: true
        }
      };

      const crawlResult = await FirecrawlService.crawlWebsite(crawlOptions);
      if (!crawlResult.success) {
        throw new Error(`Failed to start crawl: ${crawlResult.error || 'Unknown error'}`);
      }

      setProgress(60);
      toast.info('Crawl started, waiting for completion...');

      // Poll for completion
      const crawlId = crawlResult.id;
      let status;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        await new Promise(resolve => setTimeout(resolve, 3000));
        status = await FirecrawlService.getCrawlStatus(crawlId!);
        setProgress(60 + Math.min((attempts / maxAttempts) * 30, 30));
        attempts++;
      } while (status.status === 'scraping' && attempts < maxAttempts);

      if (status.status !== 'completed') {
        throw new Error(`Crawl did not complete in time: ${status.status}`);
      }

      setProgress(90);
      toast.info('Getting crawl results...');

      // Get the results
      const results = await FirecrawlService.getCrawlResults(crawlId!);
      setResult(results);
      setProgress(100);
      toast.success('Website crawl completed successfully!');
    } catch (error) {
      console.error('Error crawling website:', error);
      toast.error(`Failed to crawl website: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Website Crawler</CardTitle>
        <CardDescription>
          Crawl and extract content from websites to use in your AI knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCrawlWebsite} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700">
              Website URL
            </label>
            <div className="flex gap-2">
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isProcessing}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={isProcessing || !url.trim()}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  'Start Crawl'
                )}
              </Button>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-3">
              <h3 className="text-lg font-medium">Crawl Results</h3>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total Pages:</div>
                  <div className="font-medium">{result.total}</div>
                  
                  <div>Completed Pages:</div>
                  <div className="font-medium">{result.completed}</div>
                  
                  <div>Credits Used:</div>
                  <div className="font-medium">{result.creditsUsed}</div>
                  
                  {result.expiresAt && (
                    <>
                      <div>Expires At:</div>
                      <div className="font-medium">{new Date(result.expiresAt).toLocaleString()}</div>
                    </>
                  )}
                </div>

                {result.pages && result.pages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Crawled Pages:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {result.pages.slice(0, 5).map((page: any, index: number) => (
                        <li key={index}>
                          <a 
                            href={page.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline"
                          >
                            {page.title || page.url}
                          </a>
                        </li>
                      ))}
                      {result.pages.length > 5 && (
                        <li className="text-gray-500">
                          ...and {result.pages.length - 5} more pages
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
