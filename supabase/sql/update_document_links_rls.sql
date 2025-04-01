
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
DROP POLICY IF EXISTS "service_role_full_access" ON document_links;
DROP POLICY IF EXISTS "authenticated_select_all" ON document_links;
DROP POLICY IF EXISTS "authenticated_insert" ON document_links;
DROP POLICY IF EXISTS "authenticated_update" ON document_links;
DROP POLICY IF EXISTS "authenticated_delete" ON document_links;
DROP POLICY IF EXISTS "anon_view_only" ON document_links;
DROP POLICY IF EXISTS "service_role_all_access" ON document_links;
DROP POLICY IF EXISTS "authenticated_users_access" ON document_links;
DROP POLICY IF EXISTS "authenticated_all_access" ON document_links;
DROP POLICY IF EXISTS "anon_read_only" ON document_links;

-- Create a simple policy for service role with full access
CREATE POLICY "service_role_all_access"
    ON document_links
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create a simple policy for authenticated users with full access during development
CREATE POLICY "authenticated_users_access"
    ON document_links
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create a policy for anon users to view only
CREATE POLICY "anon_read_only"
    ON document_links
    FOR SELECT
    TO anon
    USING (true);

-- Grant necessary permissions to the document_links table
GRANT ALL ON document_links TO authenticated;
GRANT SELECT ON document_links TO anon;
GRANT ALL ON document_links TO service_role;
