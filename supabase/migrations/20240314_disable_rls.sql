-- Disable RLS for the tables
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_temp_passwords DISABLE ROW LEVEL SECURITY;

-- Grant permissions to service_role
GRANT ALL ON public.clients TO service_role;
GRANT ALL ON public.ai_agents TO service_role;
GRANT ALL ON public.client_temp_passwords TO service_role;
GRANT ALL ON auth.users TO service_role;
