-- Add metadata column to website_urls table
ALTER TABLE website_urls 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Grant necessary permissions
GRANT ALL ON website_urls TO authenticated;
GRANT ALL ON website_urls TO service_role;

-- Update RLS policies to include metadata column
DROP POLICY IF EXISTS "Users can insert their own website URLs" ON website_urls;
CREATE POLICY "Users can insert their own website URLs"
    ON website_urls FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

-- Add an index on the metadata column for better performance
CREATE INDEX IF NOT EXISTS idx_website_urls_metadata ON website_urls USING gin (metadata);

-- Add a trigger to validate metadata JSON
CREATE OR REPLACE FUNCTION validate_website_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure metadata is valid JSON
    IF NEW.metadata IS NOT NULL AND 
       NOT (jsonb_typeof(NEW.metadata) = 'object' OR jsonb_typeof(NEW.metadata) = 'null') THEN
        RAISE EXCEPTION 'metadata must be a valid JSON object';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER website_metadata_validation
    BEFORE INSERT OR UPDATE ON website_urls
    FOR EACH ROW
    EXECUTE FUNCTION validate_website_metadata(); 