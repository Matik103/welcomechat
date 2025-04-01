
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

-- Create policies with EXPLICIT full permissions for service role
CREATE POLICY "service_role_full_access"
    ON document_links
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create a policy for authenticated users to view any document links
CREATE POLICY "authenticated_select_all"
    ON document_links
    FOR SELECT
    TO authenticated
    USING (true);

-- Create a policy for authenticated users to insert document links
CREATE POLICY "authenticated_insert"
    ON document_links
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create a policy for authenticated users to update document links
CREATE POLICY "authenticated_update"
    ON document_links
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create a policy for authenticated users to delete document links
CREATE POLICY "authenticated_delete"
    ON document_links
    FOR DELETE
    TO authenticated
    USING (true);

-- Anon users can only view
CREATE POLICY "anon_view_only"
    ON document_links
    FOR SELECT
    TO anon
    USING (true);
