-- Create document_processing_jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.document_processing_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    document_url text NOT NULL,
    document_type text NOT NULL,
    agent_name text,
    document_id text,
    processing_method text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    error text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create document_processing_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.document_processing_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid REFERENCES public.document_processing_jobs(id) ON DELETE CASCADE,
    status text NOT NULL,
    progress integer DEFAULT 0,
    stage text,
    message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doc_processing_jobs_client_id ON public.document_processing_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_doc_processing_jobs_status ON public.document_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_doc_processing_status_job_id ON public.document_processing_status(job_id);

-- Add OpenAI Assistant related columns to ai_agents if they don't exist
ALTER TABLE public.ai_agents
ADD COLUMN IF NOT EXISTS openai_assistant_id text,
ADD COLUMN IF NOT EXISTS chunk_index integer,
ADD COLUMN IF NOT EXISTS total_chunks integer,
ADD COLUMN IF NOT EXISTS chunk_metadata jsonb DEFAULT '{}'::jsonb;

-- Create index for OpenAI Assistant ID
CREATE INDEX IF NOT EXISTS idx_ai_agents_openai_assistant_id ON public.ai_agents(openai_assistant_id);

-- Add new activity types to the enum
DO $$
BEGIN
  -- Add new enum values if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type_enum') THEN
    CREATE TYPE activity_type_enum AS ENUM (
      'document_uploaded',
      'document_processing_started',
      'document_processing_completed',
      'document_processing_failed',
      'openai_assistant_document_added',
      'openai_assistant_upload_failed'
    );
  ELSE
    -- Add new values to existing enum
    BEGIN
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'document_uploaded';
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'document_processing_started';
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'document_processing_completed';
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'document_processing_failed';
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'openai_assistant_document_added';
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'openai_assistant_upload_failed';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.document_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_processing_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_processing_jobs
CREATE POLICY "Users can view their own processing jobs"
ON public.document_processing_jobs
FOR SELECT
USING (client_id = auth.uid()::uuid);

CREATE POLICY "Users can create processing jobs"
ON public.document_processing_jobs
FOR INSERT
WITH CHECK (client_id = auth.uid()::uuid);

-- Create RLS policies for document_processing_status
CREATE POLICY "Users can view their own processing status"
ON public.document_processing_status
FOR SELECT
USING (
  job_id IN (
    SELECT id FROM public.document_processing_jobs
    WHERE client_id = auth.uid()::uuid
  )
);

-- Create function to update processing status
CREATE OR REPLACE FUNCTION update_processing_status(
    p_job_id uuid,
    p_status text,
    p_progress integer,
    p_stage text,
    p_message text DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.document_processing_status (
        job_id,
        status,
        progress,
        stage,
        message,
        metadata,
        created_at,
        updated_at
    )
    VALUES (
        p_job_id,
        p_status,
        p_progress,
        p_stage,
        p_message,
        COALESCE(p_metadata, '{}'::jsonb),
        NOW(),
        NOW()
    );

    -- Update the job status
    UPDATE public.document_processing_jobs
    SET 
        status = p_status,
        updated_at = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'last_progress', p_progress,
            'last_stage', p_stage,
            'last_update', NOW()
        )
    WHERE id = p_job_id;
END;
$$; 