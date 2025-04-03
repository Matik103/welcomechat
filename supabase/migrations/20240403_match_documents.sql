
-- Enable the vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS match_documents(uuid, vector, float, int);

-- Create a function to match documents by client ID and embedding
CREATE OR REPLACE FUNCTION match_documents(
  p_client_id UUID,
  p_query_embedding VECTOR(1536), -- OpenAI embeddings are 1536 dimensions
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 5
) 
RETURNS TABLE (
  id TEXT,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    doc.id::TEXT,
    doc.content,
    1 - (doc.embedding <=> p_query_embedding) AS similarity,
    doc.metadata
  FROM
    document_content doc
  WHERE
    doc.client_id = p_client_id
    AND 1 - (doc.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY
    doc.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;
