-- Create RPC function to set up document storage policies
CREATE OR REPLACE FUNCTION public.setup_document_storage_policies()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, ensure the bucket exists
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('document-storage', 'document-storage', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

  -- Then, create policies for the bucket
  DROP POLICY IF EXISTS "Public Access to document-storage" ON storage.objects;
  DROP POLICY IF EXISTS "Individual User Document Access" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload to document-storage" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own uploads in document-storage" ON storage.objects;

  -- Allow public access to the document-storage bucket
  CREATE POLICY "Public Access to document-storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'document-storage');

  -- Allow authenticated users to upload to the bucket
  CREATE POLICY "Authenticated users can upload to document-storage"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'document-storage');

  -- Allow users to delete their own uploads
  CREATE POLICY "Users can delete their own uploads in document-storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'document-storage');

  -- Create table for document content if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.document_content (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL,
    document_id TEXT NOT NULL,
    content TEXT,
    filename TEXT,
    file_type TEXT,
    openai_file_id TEXT,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Create index on client_id
  CREATE INDEX IF NOT EXISTS idx_document_content_client_id ON public.document_content(client_id);
  
  -- Create vector similarity search index
  CREATE INDEX IF NOT EXISTS idx_document_content_embedding ON public.document_content 
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
  CREATE OR REPLACE FUNCTION match_documents(
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
  
  RETURN true;
END;
$$;

-- Execute the function to set up policies
SELECT public.setup_document_storage_policies();
