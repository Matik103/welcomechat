BEGIN;

-- Update the bucket configuration
UPDATE storage.buckets
SET 
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'text/plain',
    'application/vnd.google-apps.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/csv'
  ]
WHERE name = 'Client Documents';

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "client_documents_select" ON storage.objects;
DROP POLICY IF EXISTS "client_documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "client_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "client_documents_delete" ON storage.objects;

-- Create new policies
CREATE POLICY "client_documents_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = (SELECT id FROM storage.buckets WHERE name = 'Client Documents')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "client_documents_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = (SELECT id FROM storage.buckets WHERE name = 'Client Documents')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "client_documents_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = (SELECT id FROM storage.buckets WHERE name = 'Client Documents')
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = (SELECT id FROM storage.buckets WHERE name = 'Client Documents')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "client_documents_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = (SELECT id FROM storage.buckets WHERE name = 'Client Documents')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify the changes
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'Client Documents';

-- List policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';

COMMIT; 