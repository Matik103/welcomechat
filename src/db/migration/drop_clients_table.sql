
-- First, drop all foreign key constraints that reference the clients table
ALTER TABLE IF EXISTS public.client_activities DROP CONSTRAINT IF EXISTS client_activities_client_id_fkey;
ALTER TABLE IF EXISTS public.common_queries DROP CONSTRAINT IF EXISTS common_queries_client_id_fkey;
ALTER TABLE IF EXISTS public.error_logs DROP CONSTRAINT IF EXISTS error_logs_client_id_fkey;
ALTER TABLE IF EXISTS public.google_drive_links DROP CONSTRAINT IF EXISTS google_drive_links_client_id_fkey;
ALTER TABLE IF EXISTS public.website_urls DROP CONSTRAINT IF EXISTS website_urls_client_id_fkey;
ALTER TABLE IF EXISTS public.client_recovery_tokens DROP CONSTRAINT IF EXISTS client_recovery_tokens_client_id_fkey;
ALTER TABLE IF EXISTS public.user_roles DROP CONSTRAINT IF EXISTS user_roles_client_id_fkey;
ALTER TABLE IF EXISTS public.ai_agents DROP CONSTRAINT IF EXISTS ai_agents_client_id_fkey;

-- Then drop the clients table
DROP TABLE IF EXISTS public.clients;
