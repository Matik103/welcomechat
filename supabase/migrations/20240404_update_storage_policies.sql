-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload files to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files in their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files in their own folder" ON storage.objects;

-- Create new storage policies for assistant documents
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

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assistant_documents',
    'assistant_documents',
    false,
    52428800, -- 50MB
    ARRAY['text/plain', 'application/pdf', 'application/vnd.google-apps.document']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 