
-- Create the Document Storage bucket if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'documents',
        'Document Storage',
        true,
        52428800, -- 50MB in bytes
        ARRAY[
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv'
        ]
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = EXCLUDED.name,
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for documents bucket
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow authenticated users to upload their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to view their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public read access to documents" ON storage.objects;

    -- Create new policies
    CREATE POLICY "Allow authenticated users to upload their own documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Allow users to view their own documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Allow authenticated users to delete their own documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
        
    -- Add policy to allow public read access if needed
    CREATE POLICY "Allow public read access to documents"
    ON storage.objects FOR SELECT
    TO anon
    USING (bucket_id = 'documents');
END $$; 
