-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own website URLs" ON website_urls;
DROP POLICY IF EXISTS "Users can insert their own website URLs" ON website_urls;
DROP POLICY IF EXISTS "Users can update their own website URLs" ON website_urls;
DROP POLICY IF EXISTS "Users can delete their own website URLs" ON website_urls;

-- Create new policies that allow service role access
CREATE POLICY "Service role has full access to website URLs"
    ON website_urls
    FOR ALL
    USING (
        (auth.jwt() ->> 'role' = 'service_role')
        OR (
            auth.uid() IN (
                SELECT id FROM ai_agents WHERE id = client_id
            )
        )
    )
    WITH CHECK (
        (auth.jwt() ->> 'role' = 'service_role')
        OR (
            auth.uid() IN (
                SELECT id FROM ai_agents WHERE id = client_id
            )
        )
    ); 