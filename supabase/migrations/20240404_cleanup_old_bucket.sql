-- First, drop all policies related to the old bucket
DROP POLICY IF EXISTS "Public Access to document-storage" ON storage.objects;
DROP POLICY IF EXISTS "Individual User Document Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to document-storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads in document-storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow document_storage access" ON storage.objects;
DROP POLICY IF EXISTS "Allow document_storage delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role document_storage access" ON storage.objects;

-- Delete all files in the document-storage bucket
DELETE FROM storage.objects
WHERE bucket_id = 'document-storage';

-- Delete the document-storage bucket
DELETE FROM storage.buckets
WHERE id = 'document-storage';

-- Also clean up the old 'documents' bucket if it exists
DELETE FROM storage.objects
WHERE bucket_id = 'documents';

DELETE FROM storage.buckets
WHERE id = 'documents'
OR name = 'Document Storage';

-- Verify remaining buckets
SELECT id, name, created_at, public
FROM storage.buckets
ORDER BY created_at DESC; 