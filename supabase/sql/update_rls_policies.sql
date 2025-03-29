
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

-- Allow all authenticated users to access all website URLs (more permissive policy)
CREATE POLICY "Authenticated users can access all website URLs"
    ON website_urls
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Make sure RLS is enabled (but with our permissive policy)
ALTER TABLE website_urls ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'website_urls';
