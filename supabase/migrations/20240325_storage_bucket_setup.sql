-- Create and configure the documents storage bucket
DO $$
BEGIN
    -- Create the bucket if it doesn't exist
    BEGIN
        EXECUTE format('
            CREATE BUCKET IF NOT EXISTS documents
            WITH (public = false);
        ');
    EXCEPTION WHEN OTHERS THEN
        -- Bucket might already exist
        NULL;
    END;

    -- Set bucket configuration
    BEGIN
        EXECUTE format('
            ALTER BUCKET documents
            SET public = false,
            SET file_size_limit = 52428800, -- 50MB in bytes
            SET allowed_mime_types = ARRAY[
                ''application/pdf'',
                ''application/vnd.openxmlformats-officedocument.wordprocessingml.document'',
                ''text/plain''
            ];
        ');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Grant permissions
    BEGIN
        EXECUTE format('
            -- Allow authenticated users to perform all operations
            GRANT ALL ON BUCKET documents TO authenticated;
            
            -- Allow anonymous users to read public files
            GRANT SELECT ON BUCKET documents TO anon;
            
            -- Create RLS policy for uploads
            CREATE POLICY "Users can upload their own documents"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (
                bucket_id = ''documents'' AND
                (storage.foldername(name))[1] = auth.uid()::text
            );

            -- Create RLS policy for access
            CREATE POLICY "Users can view their own documents"
            ON storage.objects FOR SELECT
            TO authenticated
            USING (
                bucket_id = ''documents'' AND
                (storage.foldername(name))[1] = auth.uid()::text
            );
        ');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$; 