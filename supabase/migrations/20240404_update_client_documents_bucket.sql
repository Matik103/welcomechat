-- Drop old policies
DROP POLICY IF EXISTS "Public Access to document-storage" ON storage.objects;
DROP POLICY IF EXISTS "Individual User Document Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to document-storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads in document-storage" ON storage.objects;
DROP POLICY IF EXISTS "Service role has full access" ON storage.objects;

-- Update the bucket configuration
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

CREATE POLICY "Service role has full access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'client_documents')
WITH CHECK (bucket_id = 'client_documents');
