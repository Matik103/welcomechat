-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view their documents" ON storage.objects;

-- Create new policies for authenticated users
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-storage' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

CREATE POLICY "Allow authenticated users to view their documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'document-storage' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;

-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 