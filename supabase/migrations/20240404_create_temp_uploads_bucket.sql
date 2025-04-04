-- Drop old document_storage bucket if it exists
DROP POLICY IF EXISTS "Allow document_storage access" ON storage.objects;
DROP POLICY IF EXISTS "Allow document_storage delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role document_storage access" ON storage.objects;

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

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for client_documents bucket
DROP POLICY IF EXISTS "Allow client_documents access" ON storage.objects;
DROP POLICY IF EXISTS "Allow client_documents delete" ON storage.objects;

-- Create policy to allow authenticated users to upload to client_documents
CREATE POLICY "Allow client_documents access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'client_documents')
WITH CHECK (bucket_id = 'client_documents');

-- Create policy to allow service role full access
CREATE POLICY "Allow service role client_documents access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'client_documents')
WITH CHECK (bucket_id = 'client_documents');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role; 