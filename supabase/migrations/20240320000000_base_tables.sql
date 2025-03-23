-- Create the vector extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name text NOT NULL,
    email text UNIQUE NOT NULL,
    status text DEFAULT 'active',
    agent_name text,
    widget_settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create ai_agents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    name text NOT NULL,
    agent_description text,
    content text,
    embedding vector(1536),
    url text,
    interaction_type text,
    query_text text,
    response_time_ms integer,
    is_error boolean DEFAULT false,
    error_type text,
    error_message text,
    error_status text DEFAULT 'pending',
    topic text,
    sentiment text,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    logo_url text,
    logo_storage_path text,
    openai_assistant_id text,
    chunk_index integer,
    total_chunks integer,
    chunk_metadata jsonb DEFAULT '{}'::jsonb
);

-- Create client_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.client_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    activity_type text NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create activity_type_enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type_enum') THEN
    CREATE TYPE activity_type_enum AS ENUM (
      'document_uploaded',
      'document_processing_started',
      'document_processing_completed',
      'document_processing_failed',
      'openai_assistant_document_added',
      'openai_assistant_upload_failed',
      'client_created',
      'client_updated',
      'client_deleted',
      'client_recovered',
      'system_update'
    );
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_ai_agents_client_id ON public.ai_agents(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_name ON public.ai_agents(name);
CREATE INDEX IF NOT EXISTS idx_ai_agents_openai_assistant_id ON public.ai_agents(openai_assistant_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON public.client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_type ON public.client_activities(activity_type);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own data"
ON public.clients
FOR ALL
USING (id = auth.uid()::uuid);

CREATE POLICY "Users can view their own AI agent data"
ON public.ai_agents
FOR ALL
USING (client_id = auth.uid()::uuid);

CREATE POLICY "Users can view their own activities"
ON public.client_activities
FOR ALL
USING (client_id = auth.uid()::uuid);

-- Create service role policies
CREATE POLICY "Service role can access all client data"
ON public.clients
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service role can access all AI agent data"
ON public.ai_agents
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service role can access all activities"
ON public.client_activities
FOR ALL
TO service_role
USING (true);

-- Create user roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON public.user_roles(role);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add policy for service role access
CREATE POLICY "Service role can manage user roles"
  ON public.user_roles
  USING (true)
  WITH CHECK (true);

-- Add policy for admins to view roles
CREATE POLICY "Admins can view user roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )); 