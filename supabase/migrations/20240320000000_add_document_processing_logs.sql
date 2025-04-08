-- Create an enum for processing status
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'error');

-- Create the document processing logs table
CREATE TABLE IF NOT EXISTS document_processing_logs (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL,
    status processing_status NOT NULL DEFAULT 'pending',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_document_processing_logs_document_id ON document_processing_logs(document_id);
CREATE INDEX idx_document_processing_logs_status ON document_processing_logs(status);
CREATE INDEX idx_document_processing_logs_created_at ON document_processing_logs(created_at);

-- Add a trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_processing_logs_updated_at
    BEFORE UPDATE ON document_processing_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 