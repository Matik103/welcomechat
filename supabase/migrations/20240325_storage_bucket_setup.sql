-- Configure the Document Storage bucket
DO $$
BEGIN
    -- Update bucket configuration
    BEGIN
        EXECUTE format('
            ALTER BUCKET "Document Storage"
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
            GRANT ALL ON BUCKET "Document Storage" TO authenticated;
            
            -- Allow anonymous users to read public files
            GRANT SELECT ON BUCKET "Document Storage" TO anon;
            
            -- Create RLS policy for uploads
            CREATE POLICY "Users can upload their own documents"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (
                bucket_id = ''Document_Storage'' AND
                (storage.foldername(name))[1] = auth.uid()::text
            );

            -- Create RLS policy for access
            CREATE POLICY "Users can view their own documents"
            ON storage.objects FOR SELECT
            TO authenticated
            USING (
                bucket_id = ''Document_Storage'' AND
                (storage.foldername(name))[1] = auth.uid()::text
            );
        ');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$; 