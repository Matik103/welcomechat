-- Drop the old Document Storage bucket if it exists
DO $$
BEGIN
  -- First, ensure there are no files in the old bucket
  DELETE FROM storage.objects
  WHERE bucket_id = 'documents';

  -- Then delete the bucket itself
  DELETE FROM storage.buckets
  WHERE id = 'documents'
  AND name = 'Document Storage';
END $$; 