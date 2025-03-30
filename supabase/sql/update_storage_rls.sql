
-- Create RLS policy for the document storage bucket
BEGIN;

-- First, ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-storage', 'document-storage', true)
ON CONFLICT (id) DO NOTHING;

-- Then, create policies for the bucket
DROP POLICY IF EXISTS "Public Access to document-storage" ON storage.objects;
DROP POLICY IF EXISTS "Individual User Document Access" ON storage.objects;

-- Allow public access to the document-storage bucket
CREATE POLICY "Public Access to document-storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'document-storage');

-- Allow authenticated users to upload to the bucket
CREATE POLICY "Authenticated users can upload to document-storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'document-storage');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own uploads in document-storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'document-storage');

COMMIT;
