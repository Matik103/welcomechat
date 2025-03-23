-- Add only the essential columns needed for the form
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_ai_agents_client_name ON ai_agents(client_name);
CREATE INDEX IF NOT EXISTS idx_ai_agents_email ON ai_agents(email);

-- Create a system client if it doesn't exist
DO $$
DECLARE
    system_client_id uuid;
BEGIN
    -- Check if system client exists
    SELECT id INTO system_client_id
    FROM public.clients
    WHERE client_name = 'System';
    
    -- If not exists, create it
    IF system_client_id IS NULL THEN
        INSERT INTO public.clients (client_name, email, status)
        VALUES ('System', 'system@welcomechat.ai', 'active')
        RETURNING id INTO system_client_id;
    END IF;
    
    -- Log the migration
    INSERT INTO public.client_activities (
        client_id,
        activity_type,
        description,
        metadata
    ) VALUES (
        system_client_id,
        'schema_update',
        'Added essential client columns to ai_agents table',
        '{"migration": "20240321000004_migrate_clients_to_ai_agents"}'
    );
END $$; 