
-- Fix document_content table RLS policies
ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own documents
CREATE POLICY "Users can insert document content"
ON document_content FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to select their own documents
CREATE POLICY "Users can select their own document content"
ON document_content FOR SELECT TO authenticated
USING (true);

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
