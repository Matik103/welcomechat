import { FirecrawlService } from './src/services/FirecrawlService';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Add fetch to global scope for Node.js environment
global.fetch = fetch as any;

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function testWebsiteScraping() {
  try {
    // Initialize FirecrawlService
    const firecrawlService = new FirecrawlService({
      apiKey: process.env.FIRECRAWL_API_KEY || '',
      baseUrl: process.env.FIRECRAWL_API_URL || 'https://api.firecrawl.dev/v1'
    });

    // Test URL to scrape
    const testUrl = 'https://example.com';

    // First, check if the URL is scrapable
    console.log('Checking if URL is scrapable...');
    const scrapabilityCheck = await firecrawlService.checkScrapability(testUrl);
    console.log('Scrapability check result:', scrapabilityCheck);

    if (!scrapabilityCheck.success || !scrapabilityCheck.data) {
      console.log('URL is not scrapable:', scrapabilityCheck.error);
      return;
    }

    // Start the crawl
    console.log('Starting website crawl...');
    const crawlResult = await firecrawlService.crawlWebsite({
      url: testUrl,
      maxDepth: 2,
      limit: 10,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
        blockAds: true
      }
    });

    if (!crawlResult.success || !crawlResult.id) {
      console.error('Failed to start crawl:', crawlResult.error);
      return;
    }

    console.log('Crawl started successfully:', crawlResult);

    // Wait for a bit to let the crawl progress
    console.log('Waiting for crawl to complete...');
    let status;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
      console.log('Checking crawl status...');
      status = await firecrawlService.getCrawlStatus(crawlResult.id);
      console.log('Crawl status:', status);
      attempts++;
    } while (status.status === 'scraping' && attempts < maxAttempts);

    if (status.status === 'completed') {
      // Get crawl results
      console.log('Getting crawl results...');
      const results = await firecrawlService.getCrawlResults(crawlResult.id);
      console.log('Crawl results:', results);

      // Store results in database
      const { data, error } = await supabase
        .from('website_urls')
        .insert({
          client_id: 'test-client-id', // Replace with actual client ID
          url: testUrl,
          status: 'completed',
          last_crawled: new Date().toISOString(),
          scrapable: true,
          scrapability: 'high',
          total_pages: results.total,
          completed_pages: results.completed,
          credits_used: results.creditsUsed,
          expires_at: results.expiresAt
        })
        .select();

      if (error) {
        console.error('Failed to store results:', error);
      } else {
        console.log('Results stored successfully:', data);
      }
    } else {
      console.log('Crawl did not complete in time or failed:', status.status);
    }
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Run the test
testWebsiteScraping(); 