-- Create the Document_Storage bucket if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'Document_Storage',
        'Document_Storage',
        false,
        52428800, -- 50MB in bytes
        ARRAY[
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
            'application/msword',
            'application/vnd.ms-excel',
            'application/vnd.ms-powerpoint',
            'application/rtf',
            'text/markdown',
            'text/html',
            'application/json'
        ]::text[]
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = EXCLUDED.name,
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

    -- Set default file options for better caching and processing
    UPDATE storage.buckets
    SET file_options = jsonb_build_object(
        'cache-control', 'max-age=3600',
        'content-type', 'application/octet-stream',
        'x-amz-acl', 'private'
    )
    WHERE id = 'Document_Storage';
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for Document_Storage bucket
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow authenticated users to upload their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to view their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow service role full access" ON storage.objects;

    -- Create new policies
    CREATE POLICY "Allow authenticated users to upload their own documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'Document_Storage'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Allow users to view their own documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'Document_Storage'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Allow authenticated users to delete their own documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'Document_Storage'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    -- Allow service role full access for background processing
    CREATE POLICY "Allow service role full access"
    ON storage.objects
    TO service_role
    USING (bucket_id = 'Document_Storage')
    WITH CHECK (bucket_id = 'Document_Storage');
END $$;

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