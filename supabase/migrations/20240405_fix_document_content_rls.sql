
-- Fix RLS policies for document_content table
ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable document_content access for authenticated users" ON document_content;
DROP POLICY IF EXISTS "Enable document_content insert for authenticated users" ON document_content;
DROP POLICY IF EXISTS "Enable document_content update for authenticated users" ON document_content;

-- Create policies that allow authenticated users to access all document_content records
CREATE POLICY "Enable document_content access for authenticated users"
ON document_content FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure service role has full access
DROP POLICY IF EXISTS "Service role has full access to document_content" ON document_content;
CREATE POLICY "Service role has full access to document_content"
ON document_content FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Apply similar policies to assistant_documents table
ALTER TABLE assistant_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable assistant_documents access for authenticated users" ON assistant_documents;
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
