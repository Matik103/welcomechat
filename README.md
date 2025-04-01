# Document Processing Service

A Supabase Edge Function for processing documents using LlamaParse and Firecrawl.

## Features

- Asynchronous document processing
- Support for multiple document types (PDF, DOCX, XLSX, PPTX)
- Website crawling and content extraction
- Job status tracking
- Error handling and logging
- Rate limiting and file size validation
- OpenAI Assistant integration

## Setup

1. **Environment Variables**

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
LLAMA_CLOUD_API_KEY=your_llama_cloud_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

2. **Deploy Function**

```bash
supabase functions deploy process-document
```

## Usage

### Process Document

```bash
curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/process-document' \
-H 'Authorization: Bearer [ANON_KEY]' \
-H 'Content-Type: application/json' \
-d '{
  "documentType": "pdf",
  "clientId": "your-client-id",
  "agentName": "your-agent",
  "documentId": "your-doc-id",
  "documentUrl": "your-document-url"
}'
```

### Response

```json
{
  "success": true,
  "jobId": "job-uuid",
  "status": "pending",
  "message": "Document processing started",
  "metadata": {
    "document_type": "pdf",
    "document_url": "url",
    "processing_method": "llamaparse",
    "request_time_ms": 123
  }
}
```

## Configuration

The service includes configurable settings in `config.ts`:

- Rate limiting (30 requests/minute)
- Maximum file size (50MB)
- Processing timeout (5 minutes)
- Supported document types
- Error messages

## Database Tables

1. `document_processing_jobs`: Tracks processing jobs
2. `client_activities`: Logs client activities
3. `ai_agents`: Stores processed content
4. `function_metrics`: Monitors function performance

## Error Handling

The service includes comprehensive error handling:
- Input validation
- File type validation
- Processing errors
- API errors
- Timeout handling

## Monitoring

Monitor function performance through:
- Job status tracking
- Error logging
- Performance metrics
- Client activity tracking

## Development

1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Run locally:
```bash
supabase start
supabase functions serve process-document
```

## Production

For production deployment:
1. Update environment variables
2. Deploy function
3. Monitor logs and metrics
4. Set up alerts for errors

## Security

- JWT authentication
- Rate limiting
- File size validation
- Input sanitization
- Error message sanitization

## License

MIT
