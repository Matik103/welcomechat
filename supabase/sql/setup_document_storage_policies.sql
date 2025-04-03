
-- Create RPC function to set up document storage policies
CREATE OR REPLACE FUNCTION public.setup_document_storage_policies()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, ensure the bucket exists
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('document-storage', 'document-storage', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

  -- Then, create policies for the bucket
  DROP POLICY IF EXISTS "Public Access to document-storage" ON storage.objects;
  DROP POLICY IF EXISTS "Individual User Document Access" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload to document-storage" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own uploads in document-storage" ON storage.objects;

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

  -- Create table for document content if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.document_content (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL,
    document_id TEXT NOT NULL,
    content TEXT,
    filename TEXT,
    file_type TEXT,
    openai_file_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Create index on client_id
  CREATE INDEX IF NOT EXISTS idx_document_content_client_id ON public.document_content(client_id);
  
  RETURN true;
END;
$$;

-- Execute the function to set up policies
SELECT public.setup_document_storage_policies();
