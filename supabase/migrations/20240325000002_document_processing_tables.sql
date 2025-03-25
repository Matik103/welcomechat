-- Create document processing jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.document_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id),
    document_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for document processing jobs
CREATE INDEX IF NOT EXISTS idx_doc_processing_jobs_client_id ON public.document_processing_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_doc_processing_jobs_status ON public.document_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_doc_processing_jobs_created_at ON public.document_processing_jobs(created_at);

-- Enable RLS on document processing jobs
ALTER TABLE public.document_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document processing jobs
CREATE POLICY "Users can view their own document processing jobs"
ON public.document_processing_jobs
FOR SELECT
TO authenticated
USING (client_id = auth.uid()::uuid);

CREATE POLICY "Service role has full access to document processing jobs"
ON public.document_processing_jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create document processing status table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.document_processing_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.document_processing_jobs(id),
    status TEXT NOT NULL DEFAULT 'pending',
    error TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_duration INTEGER, -- in milliseconds
    retries INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doc_processing_status_job_id ON public.document_processing_status(job_id);
CREATE INDEX IF NOT EXISTS idx_doc_processing_status_status ON public.document_processing_status(status);
CREATE INDEX IF NOT EXISTS idx_doc_processing_created_at ON public.document_processing_status(created_at);

-- Enable RLS
ALTER TABLE public.document_processing_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own document processing status" ON public.document_processing_status;
DROP POLICY IF EXISTS "Service role has full access to document processing status" ON public.document_processing_status;

-- Create RLS policies
CREATE POLICY "Users can view their own document processing status"
ON public.document_processing_status
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.document_processing_jobs
        WHERE id = job_id
        AND client_id = auth.uid()::uuid
    )
);

CREATE POLICY "Service role has full access to document processing status"
ON public.document_processing_status
FOR ALL
TO service_role
USING (true)
WITH CHECK (true); 