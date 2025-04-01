
-- First, let's check if RLS is enabled on document_links table
ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Service role has full access to document links" ON document_links;
DROP POLICY IF EXISTS "Authenticated users can manage document links" ON document_links;
DROP POLICY IF EXISTS "Users can view their own document links" ON document_links;
DROP POLICY IF EXISTS "Users can insert their own document links" ON document_links;
DROP POLICY IF EXISTS "Users can update their own document links" ON document_links;
DROP POLICY IF EXISTS "Users can delete their own document links" ON document_links;
DROP POLICY IF EXISTS "delete_document_links" ON document_links;
DROP POLICY IF EXISTS "insert_document_links" ON document_links;
DROP POLICY IF EXISTS "select_document_links" ON document_links;
DROP POLICY IF EXISTS "update_document_links" ON document_links;

-- Create a policy for service role (admin access)
CREATE POLICY "service_role_all_access"
    ON document_links
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create a completely permissive policy for authenticated users
CREATE POLICY "authenticated_all_access"
    ON document_links
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create a policy for anon users (read only)
CREATE POLICY "anon_read_only"
    ON document_links
    FOR SELECT
    TO anon
    USING (true);
