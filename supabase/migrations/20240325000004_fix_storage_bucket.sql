-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view their documents" ON storage.objects;

-- Create new policies with correct bucket name
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-storage' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow authenticated users to view their documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'document-storage' AND
  auth.uid()::text = (storage.foldername(name))[1]
); 