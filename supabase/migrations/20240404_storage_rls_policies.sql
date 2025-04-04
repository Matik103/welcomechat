-- First, ensure the storage API is installed
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "storage";

-- Create the bucket if it doesn't exist (this needs to run as superuser)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'document-storage',
    'document-storage',
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'text/plain', 'application/vnd.google-apps.document']::text[]
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload files to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Service role has full access" ON storage.objects;

-- Policy for authenticated users to upload files to their own folder
CREATE POLICY "Users can upload files to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-storage' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for authenticated users to read their own files
CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'document-storage' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'document-storage' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'document-storage' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-storage' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for service role to have full access to all buckets and objects
CREATE POLICY "Service role has full access"
ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.buckets TO service_role; 