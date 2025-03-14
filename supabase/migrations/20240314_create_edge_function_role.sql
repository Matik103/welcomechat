-- Create a new role for the Edge Function
CREATE ROLE edge_function_role;

-- Grant usage on necessary schemas
GRANT USAGE ON SCHEMA public TO edge_function_role;
GRANT USAGE ON SCHEMA auth TO edge_function_role;

-- Grant permissions on tables
GRANT ALL ON public.clients TO edge_function_role;
GRANT ALL ON public.ai_agents TO edge_function_role;
GRANT ALL ON public.client_temp_passwords TO edge_function_role;
GRANT ALL ON auth.users TO edge_function_role;

-- Grant the role to service_role
GRANT edge_function_role TO service_role;
