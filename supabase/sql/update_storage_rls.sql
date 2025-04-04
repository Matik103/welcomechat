-- Create RLS policy for the document storage bucket
BEGIN;

-- First, ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('client_documents', 'client_documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Then, create policies for the bucket
DROP POLICY IF EXISTS "Public Access to client_documents" ON storage.objects;
DROP POLICY IF EXISTS "Individual User Document Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to client_documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads in client_documents" ON storage.objects;

-- Allow public access to the client_documents bucket
CREATE POLICY "Public Access to client_documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'client_documents');

-- Allow authenticated users to upload to the bucket
CREATE POLICY "Authenticated users can upload to client_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client_documents');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own uploads in client_documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client_documents');

COMMIT;
