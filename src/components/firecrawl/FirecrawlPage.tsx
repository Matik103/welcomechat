
import React from 'react';
import { FirecrawlConfigForm } from './FirecrawlConfigForm';
import { WebsiteCrawlerForm } from './WebsiteCrawlerForm';

export function FirecrawlPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold">Firecrawl Website Scraper</h1>
      <p className="text-gray-600">
        Use Firecrawl to scrape website content and add it to your AI knowledge base.
      </p>
      
      <FirecrawlConfigForm />
      
      <WebsiteCrawlerForm />
    </div>
  );
}
