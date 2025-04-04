
-- Fix RLS policies for document_content table
ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read for authenticated users" ON document_content;
DROP POLICY IF EXISTS "Enable write for authenticated users" ON document_content;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON document_content;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON document_content;

-- Create policies for document_content table
CREATE POLICY "Enable read for authenticated users" 
ON document_content FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable write for authenticated users" 
ON document_content FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON document_content FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" 
ON document_content FOR DELETE 
TO authenticated 
USING (true);

-- Similar policies for assistant_documents table
ALTER TABLE assistant_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for authenticated users" ON assistant_documents;
DROP POLICY IF EXISTS "Enable write for authenticated users" ON assistant_documents;

CREATE POLICY "Enable read for authenticated users" 
ON assistant_documents FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable write for authenticated users" 
ON assistant_documents FOR ALL 
TO authenticated 
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON document_content TO authenticated;
GRANT ALL ON assistant_documents TO authenticated;
