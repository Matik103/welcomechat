-- Update the bucket configuration
UPDATE storage.buckets
SET 
  public = false,
  file_size_limit = 20971520, -- 20MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'text/plain',
    'application/vnd.google-apps.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/csv'
  ]
WHERE id = 'client_documents';

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'client_documents_select');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'client_documents_insert');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'client_documents_update');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'client_documents_delete');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'client_documents_service_role');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- Create new policies
CREATE POLICY "client_documents_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'client_documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "client_documents_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'client_documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "client_documents_update"
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

CREATE POLICY "client_documents_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'client_documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role policy
CREATE POLICY "client_documents_service_role"
ON storage.objects
TO service_role
USING (bucket_id = 'client_documents')
WITH CHECK (bucket_id = 'client_documents'); 