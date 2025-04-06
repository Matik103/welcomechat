
# PDF Processing Service

A Node.js service for processing PDF documents that works in conjunction with Supabase. This service provides an API for PDF handling, with text extraction to be implemented with a different approach.

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

Process a PDF document.

**Request Body:**
```json
{
  "document_id": "required_document_id",
  "storage_path": "path/to/document.pdf"
}
```

**Response:**
```json
{
  "message": "PDF processing service ready. Text extraction functionality will be implemented with a different approach.",
  "document_id": "document_id",
  "metadata": {
    "extraction_method": "pending-implementation",
    "timestamp": "2024-03-20T12:00:00.000Z"
  }
}
```

## Integration with Supabase Edge Function

The Edge Function will forward PDF processing requests to this service.
