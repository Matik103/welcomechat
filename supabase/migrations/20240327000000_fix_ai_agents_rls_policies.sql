
-- This migration ensures proper RLS policies for the ai_agents table

-- First, make sure RLS is enabled
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow service role full access" ON public.ai_agents;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ai_agents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.ai_agents;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.ai_agents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.ai_agents;
DROP POLICY IF EXISTS "Enable public read access" ON public.ai_agents;

-- Create comprehensive policies

-- Allow service role full access (this is CRITICAL for migrations and server operations)
CREATE POLICY "Allow service role full access" ON public.ai_agents
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Read access for authenticated users
CREATE POLICY "Enable read access for all users" ON public.ai_agents
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert access for authenticated users
CREATE POLICY "Enable insert access for authenticated users" ON public.ai_agents
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Update access for authenticated users
CREATE POLICY "Enable update access for authenticated users" ON public.ai_agents
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Delete access for authenticated users
CREATE POLICY "Enable delete access for authenticated users" ON public.ai_agents
    FOR DELETE
    TO authenticated
    USING (true);

-- Allow anon users to read config items
CREATE POLICY "Enable public read access" ON public.ai_agents
    FOR SELECT 
    TO anon
    USING (interaction_type = 'config');

-- Log the policy change
INSERT INTO client_activities (activity_type, description, metadata)
VALUES (
  'system_update', 
  'Updated RLS policies for ai_agents table',
  jsonb_build_object(
    'update_type', 'rls_policy',
    'table', 'ai_agents',
    'updated_at', NOW()
  )
);
