-- Create the document content table
CREATE TABLE IF NOT EXISTS document_content (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL,
    client_id UUID NOT NULL,
    content TEXT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_document_content_document_id ON document_content(document_id);
CREATE INDEX idx_document_content_client_id ON document_content(client_id);
CREATE INDEX idx_document_content_created_at ON document_content(created_at);

-- Add a trigger to update updated_at
CREATE TRIGGER update_document_content_updated_at
    BEFORE UPDATE ON document_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 