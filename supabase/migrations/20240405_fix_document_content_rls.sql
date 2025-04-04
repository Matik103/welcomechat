
-- Fix RLS policies for document_content table
ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable document_content access for authenticated users" ON document_content;
DROP POLICY IF EXISTS "Enable document_content insert for authenticated users" ON document_content;
DROP POLICY IF EXISTS "Enable document_content update for authenticated users" ON document_content;
DROP POLICY IF EXISTS "Enable document_content delete for authenticated users" ON document_content;

-- Create more granular policies for document_content table
CREATE POLICY "Enable document_content access for authenticated users"
ON document_content FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable document_content insert for authenticated users"
ON document_content FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable document_content update for authenticated users"
ON document_content FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable document_content delete for authenticated users"
ON document_content FOR DELETE
TO authenticated
USING (true);

-- Ensure service role has full access
DROP POLICY IF EXISTS "Service role has full access to document_content" ON document_content;
CREATE POLICY "Service role has full access to document_content"
ON document_content FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Apply similar policies to assistant_documents table if it exists
ALTER TABLE assistant_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable assistant_documents access for authenticated users" ON assistant_documents;
DROP POLICY IF EXISTS "Enable assistant_documents insert for authenticated users" ON assistant_documents;
DROP POLICY IF EXISTS "Enable assistant_documents update for authenticated users" ON assistant_documents;
DROP POLICY IF EXISTS "Enable assistant_documents delete for authenticated users" ON assistant_documents;

CREATE POLICY "Enable assistant_documents access for authenticated users"
ON assistant_documents FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to assistant_documents" ON assistant_documents;
CREATE POLICY "Service role has full access to assistant_documents"
ON assistant_documents FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON document_content TO authenticated;
GRANT ALL ON document_content TO service_role;
GRANT ALL ON assistant_documents TO authenticated;
GRANT ALL ON assistant_documents TO service_role;
