-- Create website_urls table
CREATE TABLE IF NOT EXISTS website_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    agent_name TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    content TEXT,
    metadata JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(client_id, agent_name, url)
);

-- Create index on client_id and status
CREATE INDEX IF NOT EXISTS idx_website_urls_client_status ON website_urls(client_id, status);

-- Create function to add a website URL
CREATE OR REPLACE FUNCTION add_website_url(
    p_client_id UUID,
    p_agent_name TEXT,
    p_url TEXT
) RETURNS UUID AS $$
DECLARE
    v_url_id UUID;
BEGIN
    INSERT INTO website_urls (
        client_id,
        agent_name,
        url,
        status
    ) VALUES (
        p_client_id,
        p_agent_name,
        p_url,
        'pending'
    ) RETURNING id INTO v_url_id;

    RETURN v_url_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update website URL status
CREATE OR REPLACE FUNCTION update_website_url_status(
    p_url_id UUID,
    p_status TEXT,
    p_content TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_error TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE website_urls
    SET
        status = p_status,
        content = COALESCE(p_content, content),
        metadata = COALESCE(p_metadata, metadata),
        error = COALESCE(p_error, error),
        updated_at = NOW()
    WHERE id = p_url_id;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE website_urls ENABLE ROW LEVEL SECURITY;

-- Allow clients to view their own URLs
CREATE POLICY "Clients can view their own URLs"
    ON website_urls
    FOR SELECT
    USING (auth.uid() = client_id);

-- Allow clients to add URLs
CREATE POLICY "Clients can add URLs"
    ON website_urls
    FOR INSERT
    WITH CHECK (auth.uid() = client_id);

-- Allow service role to update URLs
CREATE POLICY "Service role can update URLs"
    ON website_urls
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role'); 