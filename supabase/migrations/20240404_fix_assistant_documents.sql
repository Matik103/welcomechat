-- Drop existing foreign key constraint
ALTER TABLE assistant_documents
DROP CONSTRAINT IF EXISTS assistant_documents_document_id_fkey;

-- Alter document_id column type
ALTER TABLE assistant_documents
ALTER COLUMN document_id TYPE BIGINT USING document_id::text::bigint;

-- Add foreign key constraint
ALTER TABLE assistant_documents
ADD CONSTRAINT assistant_documents_document_id_fkey
FOREIGN KEY (document_id) REFERENCES document_content(id); 