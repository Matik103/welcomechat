-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role full access" ON storage.objects;

-- Create policies for storage.objects
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated users to read their own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for service role to access all files
CREATE POLICY "Allow service role full access"
ON storage.objects FOR ALL TO service_role
USING (true)
WITH CHECK (true); 