
-- Create the client_documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('client_documents', 'client_documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop any existing policies for the client_documents bucket to avoid conflicts
DROP POLICY IF EXISTS "Public Access to client_documents" ON storage.objects;
DROP POLICY IF EXISTS "Individual User Document Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to client_documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads in client_documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can download from client_documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access all client_documents" ON storage.objects;

-- Create policies for the client_documents bucket
-- Allow public select access to the client_documents bucket (anyone can download/view)
CREATE POLICY "Public Access to client_documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'client_documents');

-- Allow authenticated users to upload to the client_documents bucket
CREATE POLICY "Authenticated users can upload to client_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client_documents');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Users can update their own uploads in client_documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client_documents');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete their own uploads in client_documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client_documents');

-- Allow service role full access to all client documents
CREATE POLICY "Service role can access all client_documents"
ON storage.objects
USING (bucket_id = 'client_documents');

-- Update RLS policies on document_content table
DROP POLICY IF EXISTS "Users can view their own client document content" ON public.document_content;
DROP POLICY IF EXISTS "Users can update their own client document content" ON public.document_content;
DROP POLICY IF EXISTS "Service role can manage document content" ON public.document_content;

-- Allow users to view their own client document content
CREATE POLICY "Users can view their own client document content"
ON public.document_content FOR SELECT
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = document_content.client_id AND clients.user_id = auth.uid()));

-- Allow users to update their own client document content
CREATE POLICY "Users can update their own client document content"
ON public.document_content FOR UPDATE
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = document_content.client_id AND clients.user_id = auth.uid()));

-- Allow service role full access to document content
CREATE POLICY "Service role can manage document content"
ON public.document_content
USING (true);

-- Enable row-level security for document_content
ALTER TABLE public.document_content ENABLE ROW LEVEL SECURITY;
