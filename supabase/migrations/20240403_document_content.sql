
-- Create document_content table if it doesn't exist
CREATE TABLE IF NOT EXISTS document_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  document_id TEXT,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(1536),
  file_type TEXT,
  filename TEXT,
  openai_file_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index on the embedding vector for faster similarity search
CREATE INDEX IF NOT EXISTS document_content_embedding_idx ON document_content USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add index on client_id for faster filtering
CREATE INDEX IF NOT EXISTS document_content_client_id_idx ON document_content(client_id);
