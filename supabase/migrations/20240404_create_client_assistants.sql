-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;

-- Create client_assistants table
CREATE TABLE IF NOT EXISTS public.client_assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(client_id, name)
);

-- Create index on client_id
CREATE INDEX IF NOT EXISTS idx_client_assistants_client_id ON public.client_assistants(client_id);

-- Enable RLS
ALTER TABLE public.client_assistants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own assistants" ON public.client_assistants;
DROP POLICY IF EXISTS "Users can manage their own assistants" ON public.client_assistants;

-- Create RLS policies for client_assistants
CREATE POLICY "Users can view their own assistants"
ON public.client_assistants
FOR SELECT
USING (auth.uid()::text = client_id::text);

CREATE POLICY "Users can manage their own assistants"
ON public.client_assistants
FOR ALL
USING (auth.uid()::text = client_id::text);

-- Create assistant_documents table
CREATE TABLE IF NOT EXISTS public.assistant_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assistant_id UUID REFERENCES public.client_assistants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT,
    content TEXT,
    storage_path TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add embedding column separately to ensure it exists before creating the index
ALTER TABLE public.assistant_documents ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assistant_documents_assistant_id ON public.assistant_documents(assistant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_documents_client_id ON public.assistant_documents(client_id);

-- Create vector index if embedding column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'assistant_documents'
        AND column_name = 'embedding'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_assistant_documents_embedding ON public.assistant_documents USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
    END IF;
END$$;

-- Enable RLS
ALTER TABLE public.assistant_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view documents through assistants" ON public.assistant_documents;
DROP POLICY IF EXISTS "Users can manage documents through assistants" ON public.assistant_documents;

-- Create RLS policies for assistant_documents
CREATE POLICY "Users can view their documents"
ON public.assistant_documents
FOR SELECT
USING (auth.uid()::text = client_id::text);

CREATE POLICY "Users can manage their documents"
ON public.assistant_documents
FOR ALL
USING (auth.uid()::text = client_id::text);

-- Grant permissions
GRANT ALL ON public.client_assistants TO authenticated;
GRANT ALL ON public.assistant_documents TO authenticated;
GRANT ALL ON public.client_assistants TO service_role;
GRANT ALL ON public.assistant_documents TO service_role; 