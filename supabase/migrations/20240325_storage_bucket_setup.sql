-- Create the Document Storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Document Storage',
  'Document Storage',
  false,
  52428800, -- 50MB in bytes
  ARRAY['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Update bucket configuration
UPDATE storage.buckets
SET
  public = false,
  file_size_limit = 52428800, -- 50MB in bytes
  allowed_mime_types = ARRAY['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
WHERE id = 'Document Storage';

-- Create policies for Document Storage bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Document Storage');

-- Allow users to read their own files
CREATE POLICY "Allow users to read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'Document Storage');

-- Allow users to update their own files
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'Document Storage')
WITH CHECK (bucket_id = 'Document Storage');

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create document processing status table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.document_processing_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_duration INTEGER, -- in milliseconds
    retries INTEGER DEFAULT 0,
    CONSTRAINT fk_client
        FOREIGN KEY(client_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_doc_processing_status_client_id ON public.document_processing_status(client_id);
CREATE INDEX IF NOT EXISTS idx_doc_processing_status_status ON public.document_processing_status(status);
CREATE INDEX IF NOT EXISTS idx_doc_processing_created_at ON public.document_processing_status(created_at);

-- Add RLS policies for document processing status
ALTER TABLE public.document_processing_status ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own document processing status" ON public.document_processing_status;
    DROP POLICY IF EXISTS "Service role has full access to document processing status" ON public.document_processing_status;

    CREATE POLICY "Users can view their own document processing status"
    ON public.document_processing_status
    FOR ALL
    TO authenticated
    USING (client_id = auth.uid());

    CREATE POLICY "Service role has full access to document processing status"
    ON public.document_processing_status
    FOR ALL
    TO service_role
    USING (true);
END $$; 