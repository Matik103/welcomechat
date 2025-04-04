-- Drop all potentially existing policies
DROP POLICY IF EXISTS "Public Access to document-storage" ON storage.objects;
DROP POLICY IF EXISTS "Individual User Document Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to document-storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads in document-storage" ON storage.objects;
DROP POLICY IF EXISTS "Service role has full access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Allow service role bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Allow service role client_documents access" ON storage.objects;
DROP POLICY IF EXISTS "Allow client_documents access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create client_documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client_documents',
  'client_documents',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'text/plain',
    'application/vnd.google-apps.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/csv',
    'application/json'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'text/plain',
    'application/vnd.google-apps.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/csv',
    'application/json'
  ]::text[];

-- Enable RLS on storage.objects and buckets
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create policies for storage.objects
CREATE POLICY "Users can upload files to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'client_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create service role policies
CREATE POLICY "Service role has full access"
ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create bucket policies
CREATE POLICY "Allow public bucket access"
ON storage.buckets FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated bucket access"
ON storage.buckets FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service role bucket access"
ON storage.buckets FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.buckets TO service_role; 