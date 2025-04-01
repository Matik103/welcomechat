
-- First, let's check if RLS is enabled on document_links table
ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role has full access to document links" ON document_links;
DROP POLICY IF EXISTS "Authenticated users can manage their own document links" ON document_links;
DROP POLICY IF EXISTS "Users can view their own document links" ON document_links;
DROP POLICY IF EXISTS "Users can insert their own document links" ON document_links;
DROP POLICY IF EXISTS "Users can update their own document links" ON document_links;
DROP POLICY IF EXISTS "Users can delete their own document links" ON document_links;
DROP POLICY IF EXISTS "Authenticated users can access all document links" ON document_links;
DROP POLICY IF EXISTS "Authenticated users can manage document links" ON document_links;

-- Create new policies for document_links table
CREATE POLICY "Service role has full access to document links"
    ON document_links
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create a completely permissive policy for authenticated users
-- This will allow any authenticated user to perform any operation on document_links
CREATE POLICY "Authenticated users can manage document links"
    ON document_links
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'document_links';
