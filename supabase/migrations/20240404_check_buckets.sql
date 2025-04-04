-- List all buckets and their configurations
SELECT 
  id,
  name,
  owner,
  created_at,
  updated_at,
  public,
  avif_autodetection,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY created_at DESC; 