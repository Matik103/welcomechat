-- Drop existing objects to ensure clean setup
DROP FUNCTION IF EXISTS match_documents_by_embedding;
DROP FUNCTION IF EXISTS store_document_embedding;
DROP TABLE IF EXISTS public.document_content;

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the document content table
CREATE TABLE public.document_content (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL,
  document_id TEXT NOT NULL,
  content TEXT,
  filename TEXT,
  file_type TEXT,
  openai_file_id TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, document_id)
);

-- Create indexes
CREATE INDEX idx_document_content_client_id ON public.document_content(client_id);
CREATE INDEX idx_document_content_embedding ON public.document_content 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to store document embedding
CREATE OR REPLACE FUNCTION store_document_embedding(
  p_client_id TEXT,
  p_document_id TEXT,
  p_content TEXT,
  p_embedding vector(1536)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Insert or update the document content and embedding
  INSERT INTO public.document_content
    (client_id, document_id, content, embedding)
  VALUES
    (p_client_id::uuid, p_document_id, p_content, p_embedding)
  ON CONFLICT (client_id, document_id)
  DO UPDATE SET
    content = EXCLUDED.content,
    embedding = EXCLUDED.embedding,
    updated_at = NOW();
  
  -- Return success response
  result := jsonb_build_object(
    'success', TRUE,
    'message', 'Document embedding stored successfully'
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return error response
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to match documents by embedding similarity
CREATE OR REPLACE FUNCTION match_documents_by_embedding(
  p_client_id TEXT,
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  id TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.document_id::TEXT,
    dc.content,
    1 - (dc.embedding <=> p_query_embedding) as similarity
  FROM public.document_content dc
  WHERE dc.client_id = p_client_id::uuid
    AND 1 - (dc.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY dc.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$; 