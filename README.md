# Welcome.Chat - AI Document Processing System

A TypeScript-based system for processing and querying PDF documents using AI. Built with Supabase Edge Functions and OpenAI.

## Features

- PDF document upload and storage in Supabase
- Google Drive link support for PDF documents
- Advanced PDF text extraction with chunked processing
- AI-powered document querying using OpenAI
- Real-time document status tracking
- Progress tracking for large documents
- Automatic retry mechanism for failed operations
- CORS-enabled API endpoints

## Architecture

The system consists of several Supabase Edge Functions:

1. `upload-file-to-openai`: Handles document upload and storage (supports both direct uploads and Google Drive links)
2. `extract-pdf-content`: Advanced text extraction from PDF documents with chunked processing
3. `query-document`: Natural language querying of document content using OpenAI
4. `give-assistant-access`: Manages assistant access to documents
5. `check-document-status`: Monitors document processing status

## Setup

1. Configure Supabase project environment variables:
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ```

2. Deploy Edge Functions:
   ```bash
   supabase functions deploy upload-file-to-openai --no-verify-jwt
   supabase functions deploy extract-pdf-content --no-verify-jwt
   supabase functions deploy query-document --no-verify-jwt
   supabase functions deploy give-assistant-access --no-verify-jwt
   supabase functions deploy check-document-status --no-verify-jwt
   ```

## API Endpoints

### Upload Document
```http
POST /functions/v1/upload-file-to-openai
Content-Type: application/json

# For direct file upload:
{
  "client_id": "string",
  "file_data": "base64_string",
  "file_type": "application/pdf",
  "file_name": "string",
  "assistant_id": "string"
}

# For Google Drive link:
{
  "client_id": "string",
  "drive_link": "string",
  "assistant_id": "string"
}
```

### Extract PDF Content
```http
POST /functions/v1/extract-pdf-content
Content-Type: application/json

{
  "document_id": "string",
  "chunk_size": "number (optional, default: 1MB)",
  "max_chunks": "number (optional, default: 5)",
  "continue_from": "number (optional, for resuming)"
}

Response:
{
  "status": "success",
  "message": "PDF extraction completed/Chunk processing completed",
  "metadata": {
    "size": "number",
    "chunks_processed": "number",
    "total_chunks": "number",
    "current_position": "number",
    "extraction_method": "string",
    "start_time": "string",
    "last_updated": "string",
    "retries": "number",
    "errors": "string[]",
    "is_complete": "boolean"
  },
  "text_preview": "string",
  "next_chunk": "number | null"
}
```

### Query Document
```http
POST /functions/v1/query-document
Content-Type: application/json

{
  "prompt": "string",
  "document_id": "string",
  "assistant_id": "string",
  "client_id": "string"
}

Response:
{
  "status": "success",
  "response": "string (AI-generated response)"
}
```

### Give Assistant Access
```http
POST /functions/v1/give-assistant-access
Content-Type: application/json

{
  "document_id": "string",
  "assistant_id": "string",
  "client_id": "string"
}
```

### Check Status
```http
POST /functions/v1/check-document-status
Content-Type: application/json

{
  "document_id": "string",
  "assistant_id": "string"
}
```

## PDF Processing Implementation

The PDF text extraction uses an advanced chunked processing approach:

1. **Chunked Processing**
   - Processes large PDFs in configurable chunks (default 1MB)
   - Tracks progress and allows resuming from interruptions
   - Automatic retries for failed chunks
   - Memory-efficient processing of large documents

2. **Text Extraction Features**
   - PDF structure parsing (handles PDF objects and text streams)
   - Support for PDF text encoding (octal and escape sequences)
   - Preservation of important whitespace characters
   - Accurate text marker handling

3. **Progress Tracking**
   - Detailed metadata about extraction progress
   - Error tracking and retry counts
   - Processing timestamps
   - Chunk statistics

4. **Error Handling**
   - Automatic retries for failed chunks
   - Detailed error logging
   - Graceful continuation after recoverable errors
   - Validation of processing results

## Document Querying Implementation

The system provides natural language querying of document content:

1. **Query Processing**
   - Natural language understanding using OpenAI
   - Context-aware responses
   - Access control verification
   - Detailed response formatting

2. **Security Features**
   - Assistant access verification
   - Client ID validation
   - Document access control
   - Error handling for unauthorized access

3. **Response Handling**
   - Formatted JSON responses
   - Error details for failed queries
   - Preview of document content
   - Processing metadata

## Future Improvements

1. Support for additional document formats
2. Enhanced metadata extraction
3. Multi-document comparison
4. Advanced query capabilities
5. Batch processing optimization
6. Real-time processing updates
7. Enhanced error recovery
8. Document version control
9. Content summarization
10. Custom extraction rules

## License

MIT
