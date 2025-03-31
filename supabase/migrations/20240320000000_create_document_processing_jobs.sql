-- Create document_processing_jobs table
CREATE TABLE IF NOT EXISTS document_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    agent_name TEXT NOT NULL,
    document_url TEXT NOT NULL,
    document_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    content TEXT,
    metadata JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on client_id and status
CREATE INDEX IF NOT EXISTS idx_document_processing_jobs_client_status ON document_processing_jobs(client_id, status);

-- Create function to process a document
CREATE OR REPLACE FUNCTION process_document(
    p_client_id UUID,
    p_agent_name TEXT,
    p_document_url TEXT,
    p_document_type TEXT
) RETURNS UUID AS $$
DECLARE
    v_job_id UUID;
BEGIN
    INSERT INTO document_processing_jobs (
        client_id,
        agent_name,
        document_url,
        document_type,
        status
    ) VALUES (
        p_client_id,
        p_agent_name,
        p_document_url,
        p_document_type,
        'pending'
    ) RETURNING id INTO v_job_id;

    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update document processing status
CREATE OR REPLACE FUNCTION update_document_processing_status(
    p_job_id UUID,
    p_status TEXT,
    p_content TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_error TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE document_processing_jobs
    SET
        status = p_status,
        content = COALESCE(p_content, content),
        metadata = COALESCE(p_metadata, metadata),
        error = COALESCE(p_error, error),
        updated_at = NOW()
    WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE document_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Allow clients to view their own jobs
CREATE POLICY "Clients can view their own jobs"
    ON document_processing_jobs
    FOR SELECT
    USING (auth.uid() = client_id);

-- Allow clients to create jobs
CREATE POLICY "Clients can create jobs"
    ON document_processing_jobs
    FOR INSERT
    WITH CHECK (auth.uid() = client_id);

-- Allow service role to update jobs
CREATE POLICY "Service role can update jobs"
    ON document_processing_jobs
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role'); 