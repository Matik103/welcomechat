-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.document_content (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL,
  document_id TEXT NOT NULL,
  content TEXT,
  filename TEXT,
  file_type TEXT,
  storage_url TEXT,
  deepseek_file_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, document_id)
);

CREATE TABLE IF NOT EXISTS public.assistant_documents (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT REFERENCES document_content(id),
  assistant_id TEXT NOT NULL,
  client_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  deepseek_file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_document_content_client_id ON public.document_content(client_id);
CREATE INDEX IF NOT EXISTS idx_assistant_documents_document_id ON public.assistant_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_assistant_documents_assistant_id ON public.assistant_documents(assistant_id);

-- Drop existing policies first
DROP POLICY IF EXISTS "Assistants can view their documents" ON public.assistant_documents;
DROP POLICY IF EXISTS "Service role can manage assistant documents" ON public.assistant_documents;
DROP POLICY IF EXISTS "Assistants can view their documents content" ON public.document_content;
DROP POLICY IF EXISTS "Assistants can view their clients' document content" ON public.document_content;

-- Ensure RLS is enabled
ALTER TABLE public.assistant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_content ENABLE ROW LEVEL SECURITY;

-- Create new policies
DO $$ 
BEGIN
  -- Allow assistants to view their documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'assistant_documents' 
    AND policyname = 'Assistants can view their documents'
  ) THEN
    CREATE POLICY "Assistants can view their documents"
    ON public.assistant_documents FOR SELECT
    USING (assistant_id = auth.uid());
  END IF;

  -- Allow service role full access to assistant documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'assistant_documents' 
    AND policyname = 'Service role can manage assistant documents'
  ) THEN
    CREATE POLICY "Service role can manage assistant documents"
    ON public.assistant_documents FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;

  -- Allow assistants to view document content through assistant_documents link
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_content' 
    AND policyname = 'Assistants can view their documents content'
  ) THEN
    CREATE POLICY "Assistants can view their documents content"
    ON public.document_content FOR SELECT
    USING (
      EXISTS (
        SELECT 1 
        FROM assistant_documents ad 
        WHERE ad.document_id = id 
        AND ad.assistant_id = auth.uid()
        AND ad.status = 'ready'
      )
    );
  END IF;
END $$;
