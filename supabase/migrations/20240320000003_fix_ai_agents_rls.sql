
-- This migration fixes the RLS policies for the ai_agents table

-- First, disable and then re-enable RLS to reset any problematic policies
ALTER TABLE public.ai_agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ai_agents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.ai_agents;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.ai_agents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.ai_agents;
DROP POLICY IF EXISTS "Allow service role to select" ON public.ai_agents;
DROP POLICY IF EXISTS "Allow service role to insert" ON public.ai_agents;
DROP POLICY IF EXISTS "Allow service role full access" ON public.ai_agents;

-- Create comprehensive policies for all operations

-- Allow service role full access (for migrations and server operations)
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

-- For anonymous users, allow read-only access to specific fields (optional)
CREATE POLICY "Enable public read access" ON public.ai_agents
    FOR SELECT 
    TO anon
    USING (interaction_type = 'config');
