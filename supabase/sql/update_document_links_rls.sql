
-- First, let's check if RLS is enabled on document_links table
ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role has full access to document links" ON document_links;
DROP POLICY IF EXISTS "Authenticated users can manage their own document links" ON document_links;

-- Create new policies for document_links table
CREATE POLICY "Service role has full access to document links"
    ON document_links
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Allow all authenticated users to access all document links (more permissive policy)
CREATE POLICY "Authenticated users can access all document links"
    ON document_links
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'document_links';
