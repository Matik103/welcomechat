-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client_documents',
  'client_documents',
  false,
  20971520, -- 20MB
  ARRAY[
    'application/pdf',
    'text/plain',
    'application/vnd.google-apps.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'text/plain',
    'application/vnd.google-apps.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Allow users to view their own documents');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Allow users to upload their own documents');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Allow users to update their own documents');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Allow users to delete their own documents');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Allow service role full access to documents');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- Create policies for document access
CREATE POLICY "Allow users to view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'client_documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'client_documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'client_documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'client_documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'client_documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role full access
CREATE POLICY "Allow service role full access to documents"
ON storage.objects
TO service_role
USING (bucket_id = 'client_documents')
WITH CHECK (bucket_id = 'client_documents'); 