
# PDF Processing Service

A Node.js service for processing PDF documents that works in conjunction with Supabase. This service provides an API for PDF text extraction using the RapidAPI PDF to Text Converter.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your credentials:
```
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RAPIDAPI_KEY=your_rapidapi_key
```

Note: If no RAPIDAPI_KEY is provided, the service will use the default key from the documentation.

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

Process a PDF document and extract text using RapidAPI's PDF to Text Converter.

**Request Body:**
```json
{
  "document_id": "required_document_id",
  "storage_path": "path/to/document.pdf",
  "page_number": 1 // Optional: specific page to extract
}
```

**Response:**
```json
{
  "success": true,
  "document_id": "document_id",
  "message": "PDF processed successfully",
  "metadata": {
    "extraction_method": "rapidapi",
    "timestamp": "2024-04-06T12:00:00.000Z",
    "pages_processed": "all"
  }
}
```

### GET /health

Check the service health status.

**Response:**
```json
{
  "status": "ok",
  "service": "pdf-processor",
  "version": "1.0.0",
  "rapidapi": {
    "host": "pdf-to-text-converter.p.rapidapi.com",
    "key_configured": true
  }
}
```

## Integration with Supabase Edge Function

The Edge Function will forward PDF processing requests to this service, which then uses RapidAPI to extract text from PDFs.
