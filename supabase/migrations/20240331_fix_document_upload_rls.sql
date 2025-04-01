-- Drop existing policies
DROP POLICY IF EXISTS "Public Access to document-storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to document-storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads in document-storage" ON storage.objects;

-- Create new policies for document storage
CREATE POLICY "Enable storage access for authenticated users"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'document-storage')
WITH CHECK (bucket_id = 'document-storage');

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role;

-- Drop existing document_links policies
DROP POLICY IF EXISTS "service_role_all_access" ON document_links;
DROP POLICY IF EXISTS "authenticated_users_access" ON document_links;
DROP POLICY IF EXISTS "anon_read_only" ON document_links;

-- Create new policies for document_links
CREATE POLICY "Enable document_links access for authenticated users"
ON document_links FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable document_links access for service role"
ON document_links FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Enable RLS on document_links
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON document_links TO authenticated;
GRANT ALL ON document_links TO service_role; 