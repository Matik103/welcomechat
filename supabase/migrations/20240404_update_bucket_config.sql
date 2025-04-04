-- Update the bucket configuration to make it visible in the UI
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
  created_at = NOW(),
  updated_at = NOW()
WHERE id = 'document-storage';

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
  'document-storage',
  'document-storage',
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
  SELECT 1 FROM storage.buckets WHERE id = 'document-storage'
);

-- Grant necessary permissions
GRANT ALL ON storage.buckets TO postgres;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.buckets TO service_role;

-- Ensure the bucket is accessible
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access to the bucket (but not its contents)
DROP POLICY IF EXISTS "Allow public bucket access" ON storage.buckets;
CREATE POLICY "Allow public bucket access"
ON storage.buckets FOR SELECT
TO public
USING (true);

-- Create policy to allow authenticated users to access the bucket
DROP POLICY IF EXISTS "Allow authenticated bucket access" ON storage.buckets;
CREATE POLICY "Allow authenticated bucket access"
ON storage.buckets FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow service role to access the bucket
DROP POLICY IF EXISTS "Allow service role bucket access" ON storage.buckets;
CREATE POLICY "Allow service role bucket access"
ON storage.buckets FOR ALL
TO service_role
USING (true)
WITH CHECK (true); 