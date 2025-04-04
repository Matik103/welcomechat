# Welcome.Chat - AI Document Processing System

A TypeScript-based system for processing and querying PDF documents using AI. Built with Supabase Edge Functions and OpenAI.

## Features

- PDF document upload and storage in Supabase
- Google Drive link support for PDF documents
- Text extraction from PDF documents
- AI-powered document querying using OpenAI
- Real-time document status tracking
- CORS-enabled API endpoints

## Architecture

The system consists of several Supabase Edge Functions:

1. `upload-file-to-openai`: Handles document upload and storage (supports both direct uploads and Google Drive links)
2. `process-pdf`: Extracts text content from PDF documents
3. `query-assistant`: Enables AI-powered querying of document content
4. `check-document-status`: Monitors document processing status

## Setup

1. Configure Supabase project environment variables:
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Deploy Edge Functions:
   ```bash
   supabase functions deploy upload-file-to-openai --no-verify-jwt
   supabase functions deploy process-pdf --no-verify-jwt
   supabase functions deploy query-assistant --no-verify-jwt
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

### Process PDF
```http
POST /functions/v1/process-pdf
Content-Type: application/json

{
  "document_id": "number"
}
```

### Query Document
```http
POST /functions/v1/query-assistant
Content-Type: application/json

{
  "document_id": "number",
  "assistant_id": "string",
  "query": "string"
}
```

### Check Status
```http
POST /functions/v1/check-document-status
Content-Type: application/json

{
  "document_id": "number",
  "assistant_id": "string"
}
```

## Document Upload Implementation

The system supports two methods of document upload:

1. Direct File Upload:
   - Accepts base64-encoded PDF files
   - Validates file type and content
   - Stores in Supabase Storage

2. Google Drive Link:
   - Accepts Google Drive sharing links
   - Automatically extracts file ID
   - Downloads file content
   - Preserves original filename
   - Stores in Supabase Storage

Both methods:
- Generate unique storage paths
- Create document records
- Queue for text extraction
- Associate with OpenAI assistants

## PDF Processing Implementation

The PDF text extraction uses a pattern-based approach to extract text from PDF documents:

1. Decodes PDF content using UTF-8 encoding
2. Identifies text objects using PDF structure markers (BT/ET)
3. Extracts text between parentheses and angle brackets
4. Cleans and formats the extracted text
5. Updates the document content in the database

## Future Improvements

1. Enhanced text extraction patterns
2. Support for different PDF encodings
3. Better text cleaning and formatting
4. Error handling for malformed PDFs
5. Batch processing support
6. Progress tracking for large documents
7. Support for additional cloud storage providers
8. Automatic file type detection
9. Enhanced metadata extraction

## License

MIT
