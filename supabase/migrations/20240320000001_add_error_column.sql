-- Add error column to document_processing_jobs table
ALTER TABLE document_processing_jobs
ADD COLUMN IF NOT EXISTS error TEXT;

-- Add comment to the column
COMMENT ON COLUMN document_processing_jobs.error IS 'Error message if job processing failed'; 