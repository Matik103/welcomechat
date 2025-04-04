
-- Update the bucket configuration if it already exists
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'text/plain',
    'application/vnd.google-apps.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/csv',
    'application/json'
  ]::text[],
  avif_autodetection = false,
  owner = null,
  updated_at = NOW()
WHERE id = 'client_documents';

-- If the bucket doesn't exist, create it
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  avif_autodetection,
  owner,
  created_at,
  updated_at
)
SELECT
  'client_documents',
  'client_documents',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'text/plain',
    'application/vnd.google-apps.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/csv',
    'application/json'
  ]::text[],
  false,
  null,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'client_documents'
);

-- Grant necessary permissions
GRANT ALL ON storage.buckets TO postgres;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.buckets TO service_role;

-- Ensure the bucket is accessible
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public bucket access (but not its contents)
DROP POLICY IF EXISTS "Allow public client_documents access" ON storage.buckets;
CREATE POLICY "Allow public client_documents access"
ON storage.buckets FOR SELECT
TO public
USING (id = 'client_documents');

-- Create policy to allow authenticated users to access the bucket
DROP POLICY IF EXISTS "Allow authenticated client_documents access" ON storage.buckets;
CREATE POLICY "Allow authenticated client_documents access"
ON storage.buckets FOR ALL 
TO authenticated
USING (id = 'client_documents')
WITH CHECK (id = 'client_documents');

-- Create policy to allow service role to access the bucket
DROP POLICY IF EXISTS "Allow service role client_documents access" ON storage.buckets;
CREATE POLICY "Allow service role client_documents access"
ON storage.buckets FOR ALL
TO service_role
USING (id = 'client_documents')
WITH CHECK (id = 'client_documents');

-- Set up RLS policies for objects in this bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read objects in the client_documents bucket
DROP POLICY IF EXISTS "Allow client_documents read" ON storage.objects;
CREATE POLICY "Allow client_documents read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client_documents');

-- Allow authenticated users to upload objects in the client_documents bucket
DROP POLICY IF EXISTS "Allow client_documents insert" ON storage.objects;
CREATE POLICY "Allow client_documents insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client_documents');

-- Allow authenticated users to update objects in the client_documents bucket
DROP POLICY IF EXISTS "Allow client_documents update" ON storage.objects;
CREATE POLICY "Allow client_documents update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client_documents')
WITH CHECK (bucket_id = 'client_documents');

-- Allow authenticated users to delete objects in the client_documents bucket
DROP POLICY IF EXISTS "Allow client_documents delete" ON storage.objects;
CREATE POLICY "Allow client_documents delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client_documents');

-- Allow service role full access to objects in the client_documents bucket
DROP POLICY IF EXISTS "Allow service role client_documents objects access" ON storage.objects;
CREATE POLICY "Allow service role client_documents objects access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'client_documents')
WITH CHECK (bucket_id = 'client_documents');
