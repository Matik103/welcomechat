# Knowledge Base Setup

This repository contains the necessary components for setting up a knowledge base system that integrates with LlamaParse for document processing and Firecrawl for web scraping.

## Components

### Database Tables

1. `document_processing_jobs`
   - Tracks document processing jobs
   - Stores document content and metadata
   - Handles job status and error tracking

2. `website_urls`
   - Manages website URLs for web scraping
   - Stores scraped content and metadata
   - Handles URL status and error tracking

### Edge Functions

1. `process-document`
   - Handles document processing requests
   - Integrates with LlamaParse for document processing
   - Integrates with Firecrawl for web scraping
   - Updates job status in the database

### Services

1. `LlamaParseService`
   - Handles document processing using LlamaParse API
   - Supports various document types
   - Manages API authentication and requests

2. `FirecrawlService`
   - Handles web scraping using Firecrawl API
   - Supports crawling with configurable depth and limits
   - Manages API authentication and requests

## Setup

1. Set up environment variables:
   ```bash
   LLAMA_CLOUD_API_KEY=your_llama_cloud_api_key
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

2. Apply database migrations:
   ```bash
   supabase db push
   ```

3. Deploy Edge Functions:
   ```bash
   supabase functions deploy process-document
   ```

## Usage

### Processing Documents

1. Send a POST request to the `process-document` Edge Function:
   ```json
   {
     "clientId": "uuid",
     "documentType": "pdf|docx|txt|url|web_page",
     "documentUrl": "https://example.com/document.pdf",
     "agentName": "agent_name"
   }
   ```

2. The function will:
   - Create a processing job
   - Process the document using LlamaParse or Firecrawl
   - Update the job status with results

3. Monitor job status:
   ```sql
   SELECT * FROM document_processing_jobs WHERE id = 'job_id';
   ```

### Web Scraping

1. Send a POST request to the `process-document` Edge Function with:
   ```json
   {
     "clientId": "uuid",
     "documentType": "url",
     "documentUrl": "https://example.com",
     "agentName": "agent_name"
   }
   ```

2. The function will:
   - Create a website URL entry
   - Crawl the website using Firecrawl
   - Update the URL status with results

3. Monitor URL status:
   ```sql
   SELECT * FROM website_urls WHERE id = 'url_id';
   ```

## Security

- Row Level Security (RLS) is enabled on all tables
- Clients can only view and create their own entries
- Service role is required for updating entries
- API keys are stored securely as environment variables

## Error Handling

- All errors are logged and stored in the database
- Failed jobs and URLs can be retried
- Error messages are descriptive and actionable

## Monitoring

- Job and URL statuses can be monitored through the database
- Timestamps track creation and updates
- Metadata stores additional processing information
