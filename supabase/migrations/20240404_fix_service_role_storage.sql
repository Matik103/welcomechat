-- Drop existing service role policy if it exists
DROP POLICY IF EXISTS "Service role has full access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Allow service role bucket access" ON storage.buckets;

-- Create policy for service role to have full access to all buckets and objects
CREATE POLICY "Service role has full access"
ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Update bucket configuration
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
  ]::text[]
WHERE id = 'client_documents';

-- Enable RLS on storage.buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access to the bucket (but not its contents)
CREATE POLICY "Allow public bucket access"
ON storage.buckets FOR SELECT
TO public
USING (true);

-- Create policy to allow authenticated users to access the bucket
CREATE POLICY "Allow authenticated bucket access"
ON storage.buckets FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow service role to access the bucket
CREATE POLICY "Allow service role bucket access"
ON storage.buckets FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role; 