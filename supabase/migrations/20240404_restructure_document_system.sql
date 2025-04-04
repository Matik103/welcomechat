-- Drop existing policies and tables
DROP POLICY IF EXISTS "Users can upload files to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.document_content;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.document_content;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.document_content;
DROP POLICY IF EXISTS "Users can view their assistant documents" ON public.assistant_documents;
DROP POLICY IF EXISTS "Users can manage their assistant documents" ON public.assistant_documents;

-- Drop existing tables
DROP TABLE IF EXISTS public.assistant_documents;
DROP TABLE IF EXISTS public.document_content;

-- Create new tables with improved structure
CREATE TABLE public.client_assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, name)
);

CREATE TABLE public.assistant_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assistant_id UUID REFERENCES client_assistants(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT,
    content TEXT,
    storage_path TEXT,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.client_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_documents ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_client_assistants_client_id ON public.client_assistants(client_id);
CREATE INDEX idx_assistant_documents_assistant_id ON public.assistant_documents(assistant_id);
CREATE INDEX idx_assistant_documents_embedding ON public.assistant_documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create RLS policies for client_assistants
CREATE POLICY "Users can view their own assistants"
ON public.client_assistants FOR SELECT
TO authenticated
USING (auth.uid()::text = client_id::text);

CREATE POLICY "Users can manage their own assistants"
ON public.client_assistants FOR ALL
TO authenticated
USING (auth.uid()::text = client_id::text)
WITH CHECK (auth.uid()::text = client_id::text);

-- Create RLS policies for assistant_documents
CREATE POLICY "Users can view documents through their assistants"
ON public.assistant_documents FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.client_assistants
        WHERE id = assistant_documents.assistant_id
        AND client_id::text = auth.uid()::text
    )
);

CREATE POLICY "Users can manage documents through their assistants"
ON public.assistant_documents FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.client_assistants
        WHERE id = assistant_documents.assistant_id
        AND client_id::text = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.client_assistants
        WHERE id = assistant_documents.assistant_id
        AND client_id::text = auth.uid()::text
    )
);

-- Create function to match documents by embedding for a specific assistant
CREATE OR REPLACE FUNCTION public.match_assistant_documents(
    p_assistant_id UUID,
    p_query_embedding vector(1536),
    p_match_threshold FLOAT DEFAULT 0.5,
    p_match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
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
        doc.id,
        doc.content,
        1 - (doc.embedding <=> p_query_embedding) AS similarity,
        doc.metadata
    FROM
        assistant_documents doc
    WHERE
        doc.assistant_id = p_assistant_id
        AND doc.status = 'ready'
        AND 1 - (doc.embedding <=> p_query_embedding) > p_match_threshold
    ORDER BY
        doc.embedding <=> p_query_embedding
    LIMIT p_match_count;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON public.client_assistants TO authenticated;
GRANT ALL ON public.client_assistants TO service_role;
GRANT ALL ON public.assistant_documents TO authenticated;
GRANT ALL ON public.assistant_documents TO service_role;
GRANT USAGE ON SEQUENCE client_assistants_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE client_assistants_id_seq TO service_role;
GRANT USAGE ON SEQUENCE assistant_documents_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE assistant_documents_id_seq TO service_role; 