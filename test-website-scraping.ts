import { FirecrawlService } from './src/services/FirecrawlService.js';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Add fetch to global scope for Node.js environment
global.fetch = fetch as any;

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'FIRECRAWL_API_KEY',
  'FIRECRAWL_API_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_ANON_KEY as string
);

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testWebsiteScraping() {
  try {
    // Initialize FirecrawlService
    const firecrawlService = new FirecrawlService({
      apiKey: process.env.FIRECRAWL_API_KEY as string,
      baseUrl: process.env.FIRECRAWL_API_URL as string
    });

    const url = 'https://autokey.ca/';
    console.log(`Testing URL: ${url}`);

    // Check if URL is scrapable
    console.log('Checking URL scrapability...');
    const scrapabilityResult = await firecrawlService.validateUrl(url);
    console.log('Scrapability check result:', JSON.stringify(scrapabilityResult, null, 2));

    if (!scrapabilityResult.scrapable) {
      throw new Error(`URL is not scrapable: ${scrapabilityResult.error || 'Unknown error'}`);
    }

    // Start the crawl
    console.log('Starting crawl...');
    const crawlResult = await firecrawlService.crawlWebsite({
      url,
      scrapeOptions: {
        maxDepth: 3,
        maxPages: 50,
        ignoreSitemap: false,
        ignoreQueryParameters: true,
        allowBackwardLinks: true,
        allowExternalLinks: false,
        excludeTags: ['nav', 'footer', 'script', 'style', 'iframe'],
        removeBase64Images: true,
        timeout: 30000 // 30 seconds timeout
      }
    });

    console.log('Crawl started with ID:', crawlResult.id);

    // Poll for completion with exponential backoff
    const maxAttempts = 20; // Increased from 10 to 20
    const initialPollInterval = 10000; // Start with 10 seconds
    let attempts = 0;
    let crawlStatus;
    let currentPollInterval = initialPollInterval;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Checking crawl status (attempt ${attempts}/${maxAttempts})...`);
      
      try {
        crawlStatus = await firecrawlService.getCrawlStatus(crawlResult.id);
        console.log('Crawl status:', JSON.stringify(crawlStatus, null, 2));

        if (crawlStatus.status === 'completed') {
          // Extract content from the status response
          const content = crawlStatus.data?.map(page => page.markdown).join('\n\n');
          
          if (!content) {
            throw new Error('No content found in crawl results');
          }

          console.log('Storing results in database...');
          // Store in Supabase
          const { error } = await supabase
            .from('website_urls')
            .insert({
              client_id: process.env.TEST_CLIENT_ID || 'default_client', // Use environment variable or fallback
              url: url,
              status: 'completed',
              last_crawled: new Date().toISOString(),
              scrapable: true,
              scrapability: scrapabilityResult,
              total_pages: crawlStatus.totalPages || 1,
              completed_pages: crawlStatus.completedPages || 1,
              credits_used: crawlStatus.creditsUsed || 1,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              content: content,
              metadata: crawlStatus.metadata || {}
            });

          if (error) {
            console.error('Database error:', error);
            throw error;
          }

          console.log('Successfully stored crawl results in database');
          break;
        }

        if (crawlStatus.status === 'failed') {
          throw new Error(`Crawl failed: ${crawlStatus.error || 'Unknown error'}`);
        }

        // Exponential backoff for polling
        console.log(`Waiting ${currentPollInterval/1000} seconds before next check...`);
        await delay(currentPollInterval);
        currentPollInterval = Math.min(currentPollInterval * 1.5, 60000); // Cap at 60 seconds
      } catch (error) {
        console.error(`Error checking crawl status (attempt ${attempts}):`, error instanceof Error ? error.message : error);
        if (attempts === maxAttempts) {
          throw error;
        }
        // Use exponential backoff for retries too
        await delay(currentPollInterval);
        currentPollInterval = Math.min(currentPollInterval * 1.5, 60000);
      }
    }

    if (attempts >= maxAttempts) {
      throw new Error('Crawl did not complete within the maximum number of attempts');
    }

  } catch (error) {
    console.error('Error during website scraping test:', error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

// Run the test
testWebsiteScraping();
