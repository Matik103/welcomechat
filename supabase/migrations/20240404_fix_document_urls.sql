-- Update document URLs in document_content table
UPDATE document_content
SET storage_url = REPLACE(storage_url, '/public/documents/', '/public/client_documents/')
WHERE storage_url LIKE '%/public/documents/%';

-- Update document URLs in document_processing_jobs table
UPDATE document_processing_jobs
SET document_url = REPLACE(document_url, '/public/documents/', '/public/client_documents/')
WHERE document_url LIKE '%/public/documents/%';

-- Update document URLs in assistant_documents table
UPDATE assistant_documents
SET document_url = REPLACE(document_url, '/public/documents/', '/public/client_documents/')
WHERE document_url LIKE '%/public/documents/%'; 