-- Check if bucket exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'document-storage'
    ) THEN
        -- Create the bucket if it doesn't exist
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'document-storage',
            'document-storage', -- Use the same name as id to avoid conflicts
            false,
            52428800, -- 50MB in bytes
            ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        );
    ELSE
        -- Update existing bucket configuration
        UPDATE storage.buckets
        SET 
            public = false,
            file_size_limit = 52428800,
            allowed_mime_types = ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        WHERE id = 'document-storage';
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.buckets TO anon;

-- Create RLS policies
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'document-storage' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'document-storage' AND
    auth.uid()::text = (storage.foldername(name))[1]
); 