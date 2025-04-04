-- Create vector extension in the public schema
CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;

-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS public.assistant_documents;
DROP TABLE IF EXISTS public.document_content;
DROP FUNCTION IF EXISTS public.store_document_embedding;
DROP FUNCTION IF EXISTS public.match_documents(uuid, vector, float, int);
DROP FUNCTION IF EXISTS public.match_documents_by_embedding(uuid, vector, float, int);
DROP FUNCTION IF EXISTS public.match_documents;

-- Create document_content table
CREATE TABLE public.document_content (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL,
  document_id TEXT NOT NULL,
  content TEXT,
  filename TEXT,
  file_type TEXT,
  storage_url TEXT,
  openai_file_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, document_id)
);

-- Create indexes for better performance
CREATE INDEX idx_document_content_client_id ON public.document_content(client_id);
CREATE INDEX idx_document_content_embedding ON public.document_content 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create assistant_documents table for managing access
CREATE TABLE public.assistant_documents (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT REFERENCES document_content(id),
  assistant_id TEXT NOT NULL,
  client_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  openai_file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for assistant_documents
CREATE INDEX idx_assistant_documents_document_id ON public.assistant_documents(document_id);
CREATE INDEX idx_assistant_documents_assistant_id ON public.assistant_documents(assistant_id);

-- Enable Row Level Security
ALTER TABLE public.document_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_content
CREATE POLICY "Users can view their own documents"
ON public.document_content FOR SELECT
TO authenticated
USING (auth.uid()::text = client_id::text);

CREATE POLICY "Users can insert their own documents"
ON public.document_content FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = client_id::text);

CREATE POLICY "Users can update their own documents"
ON public.document_content FOR UPDATE
TO authenticated
USING (auth.uid()::text = client_id::text);

CREATE POLICY "Service role has full access to documents"
ON public.document_content FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create RLS policies for assistant_documents
CREATE POLICY "Users can view their assistant documents"
ON public.assistant_documents FOR SELECT
TO authenticated
USING (auth.uid()::text = client_id::text);

CREATE POLICY "Users can manage their assistant documents"
ON public.assistant_documents FOR ALL
TO authenticated
USING (auth.uid()::text = client_id::text)
WITH CHECK (auth.uid()::text = client_id::text);

CREATE POLICY "Service role has full access to assistant documents"
ON public.assistant_documents FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to store document content and embedding
CREATE OR REPLACE FUNCTION public.store_document_embedding(
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

-- Create function to match documents by embedding similarity
CREATE OR REPLACE FUNCTION public.match_documents_by_embedding(
  p_client_id UUID,
  p_query_embedding vector(1536),
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
SECURITY DEFINER
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

-- Grant necessary permissions
GRANT ALL ON public.document_content TO authenticated;
GRANT ALL ON public.document_content TO service_role;
GRANT ALL ON public.assistant_documents TO authenticated;
GRANT ALL ON public.assistant_documents TO service_role;
GRANT USAGE ON SEQUENCE document_content_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE document_content_id_seq TO service_role;
GRANT USAGE ON SEQUENCE assistant_documents_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE assistant_documents_id_seq TO service_role; 