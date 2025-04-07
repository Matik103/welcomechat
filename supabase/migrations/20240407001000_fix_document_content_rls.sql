
-- Fix document_content table RLS policies
ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert document content" ON document_content;
DROP POLICY IF EXISTS "Users can select their own document content" ON document_content;
DROP POLICY IF EXISTS "Users can update their own document content" ON document_content;
DROP POLICY IF EXISTS "Users can delete their own document content" ON document_content;

-- Allow authenticated users to insert document content
CREATE POLICY "Users can insert document content"
ON document_content FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to select document content they own
-- or document content related to clients they have access to
CREATE POLICY "Users can select document content"
ON document_content FOR SELECT TO authenticated
USING (
  -- Users can see document content where they are authenticated
  auth.uid() = client_id
  OR
  -- Or documents associated with clients they have permissions for
  client_id IN (
    SELECT id FROM clients
    WHERE client_id = auth.uid()
    OR id IN (
      SELECT client_id FROM client_users
      WHERE user_id = auth.uid()
    )
  )
);

-- Allow authenticated users to update document content they own
CREATE POLICY "Users can update document content"
ON document_content FOR UPDATE TO authenticated
USING (
  auth.uid() = client_id
  OR
  client_id IN (
    SELECT id FROM clients
    WHERE client_id = auth.uid()
    OR id IN (
      SELECT client_id FROM client_users
      WHERE user_id = auth.uid()
    )
  )
);

-- Allow authenticated users to delete document content they own
CREATE POLICY "Users can delete document content"
ON document_content FOR DELETE TO authenticated
USING (
  auth.uid() = client_id
  OR
  client_id IN (
    SELECT id FROM clients
    WHERE client_id = auth.uid()
    OR id IN (
      SELECT client_id FROM client_users
      WHERE user_id = auth.uid()
    )
  )
);

-- Create function to check/fix RLS
CREATE OR REPLACE FUNCTION fix_document_content_rls()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function just exists as an endpoint for the frontend to call
  -- The actual RLS policies are set by the migration
  RETURN true;
END;
$$;

-- Add a useful function to get MIME types and file extensions
CREATE OR REPLACE FUNCTION get_file_mime_type(filename text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  extension text;
BEGIN
  extension := lower(substring(filename from '\.([^\.]+)$'));
  
  CASE extension
    WHEN 'pdf' THEN RETURN 'application/pdf';
    WHEN 'doc' THEN RETURN 'application/msword';
    WHEN 'docx' THEN RETURN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    WHEN 'txt' THEN RETURN 'text/plain';
    WHEN 'csv' THEN RETURN 'text/csv';
    WHEN 'xls' THEN RETURN 'application/vnd.ms-excel';
    WHEN 'xlsx' THEN RETURN 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    ELSE RETURN 'application/octet-stream';
  END CASE;
END;
$$;
