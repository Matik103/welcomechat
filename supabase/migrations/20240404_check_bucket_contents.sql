-- List all files in the client_documents bucket
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  metadata,
  path_tokens
FROM storage.objects
WHERE bucket_id = 'client_documents'
ORDER BY created_at DESC; 