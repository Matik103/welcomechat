-- Add error column to document_processing_jobs table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'document_processing_jobs' 
        AND column_name = 'error'
    ) THEN
        ALTER TABLE document_processing_jobs
        ADD COLUMN error TEXT;
        
        COMMENT ON COLUMN document_processing_jobs.error IS 'Error message if job processing failed';
    END IF;
END $$; 