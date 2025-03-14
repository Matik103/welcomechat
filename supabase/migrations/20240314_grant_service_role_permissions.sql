-- Grant permissions to service role
GRANT ALL ON public.clients TO service_role;
GRANT ALL ON public.ai_agents TO service_role;
GRANT ALL ON public.client_temp_passwords TO service_role;
GRANT ALL ON auth.users TO service_role;
