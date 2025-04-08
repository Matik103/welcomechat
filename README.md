# Welcome Chat

A chat application with document processing capabilities.

## Features

- Document upload and management
- PDF text extraction using RapidAPI
- Real-time chat functionality
- Document content storage and retrieval

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAPIDAPI_KEY=your_rapidapi_key
```

3. Start the development server:
```bash
npm run dev
```

## PDF Processing

The application uses RapidAPI's PDF to Text Converter for extracting text from PDF documents. The process is handled directly in the client-side code for better performance and reliability.

### Document Upload Flow

1. User selects or drags a PDF file
2. File is uploaded to Supabase storage
3. If the file is a PDF:
   - The file is sent directly to RapidAPI for text extraction
   - Extracted text is stored in the document_content table
4. Document metadata is updated with processing status and results

## Database Schema

### document_content
- id: UUID (primary key)
- content: Text (extracted content)
- metadata: JSON (file metadata, processing status, etc.)
- created_at: Timestamp
- updated_at: Timestamp

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
