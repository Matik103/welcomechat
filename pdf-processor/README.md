# PDF Processing Service

A Node.js service for extracting text from PDF documents using the `pdf-parse` library. This service works in conjunction with Supabase to process and store PDF content.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your Supabase credentials:
```
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Running the Service

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### POST /process

Process a PDF document and extract its text content.

**Request Body:**
```json
{
  "document_id": "required_document_id",
  "storage_path": "path/to/document.pdf",
  "chunk_size": 1048576,
  "max_chunks": 1,
  "continue_from": 0
}
```

**Response:**
```json
{
  "status": "success",
  "message": "PDF extraction completed",
  "metadata": {
    "page_count": 5,
    "extraction_method": "pdf-parse-extraction",
    "size": 15000,
    "chunks_processed": 1,
    "total_chunks": 1,
    "current_position": 15000,
    "start_time": "2024-03-20T12:00:00.000Z",
    "last_updated": "2024-03-20T12:00:01.000Z",
    "retries": 0,
    "errors": [],
    "is_complete": true
  },
  "text_preview": "First 200 characters of extracted text...",
  "next_chunk": null
}
```

## Integration with Supabase Edge Function

Update your Supabase Edge Function environment variables to include:
```bash
PDF_PROCESSOR_URL=http://your-service-url:3000
```

The Edge Function will forward PDF processing requests to this service. 