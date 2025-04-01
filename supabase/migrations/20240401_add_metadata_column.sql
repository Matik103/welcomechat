-- Add metadata column to website_urls table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'website_urls' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE website_urls 
        ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$; 