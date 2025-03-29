-- Drop existing policies
DROP POLICY IF EXISTS "Service role has full access to website URLs" ON website_urls;
DROP POLICY IF EXISTS "Authenticated users can manage their own website URLs" ON website_urls;
DROP POLICY IF EXISTS "Public can read website URLs" ON website_urls;

-- Create new policies for website_urls table
CREATE POLICY "Service role has full access to website URLs"
    ON website_urls
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Authenticated users can manage their own website URLs"
    ON website_urls
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
        OR 
        auth.uid() IN (
            SELECT user_id FROM user_clients WHERE client_id = website_urls.client_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
        OR 
        auth.uid() IN (
            SELECT user_id FROM user_clients WHERE client_id = website_urls.client_id
        )
    );

-- Enable RLS
ALTER TABLE website_urls ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'website_urls'; 