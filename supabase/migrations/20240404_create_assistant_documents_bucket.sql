-- Create assistant_documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assistant_documents',
  'assistant_documents',
  false,
  52428800, -- 50MB
  ARRAY['text/plain', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies for this bucket
DROP POLICY IF EXISTS "Authenticated users can upload assistant documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their assistant documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their assistant documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their assistant documents" ON storage.objects;

-- Create policies for assistant documents
CREATE POLICY "Users can upload assistant documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assistant_documents'
  AND (
    SELECT true
    FROM public.client_assistants
    WHERE id::text = (storage.foldername(name))[2]
    AND client_id::text = auth.uid()
  )
);

CREATE POLICY "Users can view their assistant documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'assistant_documents'
  AND (
    SELECT true
    FROM public.client_assistants
    WHERE id::text = (storage.foldername(name))[2]
    AND client_id::text = auth.uid()
  )
);

CREATE POLICY "Users can update their assistant documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'assistant_documents'
  AND (
    SELECT true
    FROM public.client_assistants
    WHERE id::text = (storage.foldername(name))[2]
    AND client_id::text = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'assistant_documents'
  AND (
    SELECT true
    FROM public.client_assistants
    WHERE id::text = (storage.foldername(name))[2]
    AND client_id::text = auth.uid()
  )
);

CREATE POLICY "Users can delete their assistant documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'assistant_documents'
  AND (
    SELECT true
    FROM public.client_assistants
    WHERE id::text = (storage.foldername(name))[2]
    AND client_id::text = auth.uid()
  )
);

-- Grant access to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated; 