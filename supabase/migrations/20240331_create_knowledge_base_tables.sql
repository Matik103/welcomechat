-- Create document_processing_jobs table
CREATE TABLE IF NOT EXISTS document_processing_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    document_url TEXT NOT NULL,
    document_type TEXT NOT NULL,
    document_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    error TEXT,
    processing_method TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Create website_urls table
CREATE TABLE IF NOT EXISTS website_urls (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    refresh_rate INTEGER DEFAULT 30,
    status TEXT DEFAULT 'pending',
    scrapable BOOLEAN DEFAULT true,
    is_sitemap BOOLEAN DEFAULT false,
    scrapability TEXT,
    last_crawled TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_processing_jobs_client_id ON document_processing_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_jobs_status ON document_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_website_urls_client_id ON website_urls(client_id);
CREATE INDEX IF NOT EXISTS idx_website_urls_url ON website_urls(url);

-- Enable Row Level Security (RLS)
ALTER TABLE document_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_urls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_processing_jobs
CREATE POLICY "Users can view their own document processing jobs"
    ON document_processing_jobs FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

CREATE POLICY "Users can insert their own document processing jobs"
    ON document_processing_jobs FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

-- Create RLS policies for website_urls
CREATE POLICY "Users can view their own website URLs"
    ON website_urls FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

CREATE POLICY "Users can insert their own website URLs"
    ON website_urls FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

CREATE POLICY "Users can update their own website URLs"
    ON website_urls FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM ai_agents WHERE id = client_id
        )
    );

-- Create function to process documents
CREATE OR REPLACE FUNCTION process_document(
    p_client_id UUID,
    p_agent_name TEXT,
    p_document_url TEXT,
    p_document_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_document_id UUID;
    v_job_id UUID;
BEGIN
    -- Generate a unique document ID
    v_document_id := gen_random_uuid();
    
    -- Create a processing job
    INSERT INTO document_processing_jobs (
        client_id,
        agent_name,
        document_url,
        document_type,
        document_id,
        metadata
    ) VALUES (
        p_client_id,
        p_agent_name,
        p_document_url,
        p_document_type,
        v_document_id,
        p_metadata
    ) RETURNING id INTO v_job_id;
    
    RETURN v_job_id;
END;
$$;

-- Create function to process website URLs
CREATE OR REPLACE FUNCTION process_website_url(
    p_client_id UUID,
    p_url TEXT,
    p_refresh_rate INTEGER DEFAULT 30,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_website_id BIGINT;
BEGIN
    -- Insert website URL
    INSERT INTO website_urls (
        client_id,
        url,
        refresh_rate,
        metadata
    ) VALUES (
        p_client_id,
        p_url,
        p_refresh_rate,
        p_metadata
    ) RETURNING id INTO v_website_id;
    
    RETURN v_website_id;
END;
$$;

-- Create function to update document processing status
CREATE OR REPLACE FUNCTION update_document_processing_status(
    p_job_id UUID,
    p_status TEXT,
    p_content TEXT DEFAULT NULL,
    p_error TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE document_processing_jobs
    SET 
        status = p_status,
        content = COALESCE(p_content, content),
        error = COALESCE(p_error, error),
        metadata = COALESCE(p_metadata, metadata),
        updated_at = timezone('utc', now())
    WHERE id = p_job_id;
END;
$$;

-- Create function to update website processing status
CREATE OR REPLACE FUNCTION update_website_processing_status(
    p_website_id BIGINT,
    p_status TEXT,
    p_scrapability TEXT DEFAULT NULL,
    p_error TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE website_urls
    SET 
        status = p_status,
        scrapability = COALESCE(p_scrapability, scrapability),
        error = COALESCE(p_error, error),
        last_crawled = CASE WHEN p_status = 'completed' THEN timezone('utc', now()) ELSE last_crawled END,
        updated_at = timezone('utc', now())
    WHERE id = p_website_id;
END;
$$; 