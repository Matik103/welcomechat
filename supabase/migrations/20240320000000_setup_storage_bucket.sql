-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-storage', 'document-storage', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the storage.objects table
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'document-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'document-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to update their own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'document-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'document-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to delete their own documents"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'document-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
); 