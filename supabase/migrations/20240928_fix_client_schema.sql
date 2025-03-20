
-- Store agent_description in widget_settings instead of as a separate column
-- Update clients schema to ensure the correct columns exist
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_storage_path TEXT;

-- Make sure each client has widget_settings as a JSONB column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'widget_settings'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN widget_settings JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Update any nulls to empty objects
UPDATE public.clients 
SET widget_settings = '{}'::jsonb 
WHERE widget_settings IS NULL;

-- Ensure the agent_description column exists in ai_agents table
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS agent_description TEXT;

-- Drop the function and remake it to NOT accept agent_description parameter
DROP FUNCTION IF EXISTS create_new_client(text, text, text, text, text, text, jsonb, text);

-- Update create_new_client function to only manage client table
CREATE OR REPLACE FUNCTION create_new_client(
  p_client_name TEXT,
  p_email TEXT,
  p_agent_name TEXT DEFAULT 'AI Assistant',
  p_logo_url TEXT DEFAULT NULL,
  p_logo_storage_path TEXT DEFAULT NULL,
  p_widget_settings JSONB DEFAULT '{}'::jsonb,
  p_status TEXT DEFAULT 'active'
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  new_client_id UUID;
  final_widget_settings JSONB;
BEGIN
  -- Merge the provided widget_settings
  final_widget_settings := COALESCE(p_widget_settings, '{}'::jsonb);
  
  -- Add logo information to widget_settings
  IF p_logo_url IS NOT NULL THEN
    final_widget_settings := jsonb_set(
      final_widget_settings, 
      '{logo_url}', 
      to_jsonb(p_logo_url)
    );
  END IF;
  
  IF p_logo_storage_path IS NOT NULL THEN
    final_widget_settings := jsonb_set(
      final_widget_settings, 
      '{logo_storage_path}', 
      to_jsonb(p_logo_storage_path)
    );
  END IF;
  
  -- Insert into clients table
  INSERT INTO clients (
    client_name,
    email,
    agent_name,
    logo_url,
    logo_storage_path,
    widget_settings,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_client_name,
    p_email,
    p_agent_name,
    p_logo_url,
    p_logo_storage_path,
    final_widget_settings,
    p_status,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_client_id;
  
  -- Insert into ai_agents table
  INSERT INTO ai_agents (
    client_id,
    name,
    agent_description,
    content,
    interaction_type,
    settings,
    logo_url,
    logo_storage_path,
    created_at,
    updated_at
  ) VALUES (
    new_client_id,
    p_agent_name,
    final_widget_settings->>'agent_description',
    '',
    'config',
    jsonb_build_object(
      'agent_name', p_agent_name,
      'agent_description', final_widget_settings->>'agent_description',
      'client_name', p_client_name,
      'logo_url', p_logo_url,
      'logo_storage_path', p_logo_storage_path,
      'created_at', NOW()
    ),
    p_logo_url,
    p_logo_storage_path,
    NOW(),
    NOW()
  );
  
  -- Create activity log for client creation
  INSERT INTO client_activities (
    client_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    new_client_id,
    'client_created',
    'New client created with AI agent: ' || p_agent_name,
    jsonb_build_object(
      'client_name', p_client_name,
      'agent_name', p_agent_name,
      'email', p_email
    )
  );
  
  RETURN new_client_id;
END;
$$;

-- Create update_ai_agent_on_client_update function
CREATE OR REPLACE FUNCTION public.update_ai_agent_on_client_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF (OLD.agent_name IS DISTINCT FROM NEW.agent_name) OR 
     (OLD.widget_settings->>'agent_description' IS DISTINCT FROM NEW.widget_settings->>'agent_description') OR
     (OLD.widget_settings->>'logo_url' IS DISTINCT FROM NEW.widget_settings->>'logo_url') OR
     (OLD.widget_settings->>'logo_storage_path' IS DISTINCT FROM NEW.widget_settings->>'logo_storage_path') THEN
    
    UPDATE public.ai_agents
    SET 
      name = COALESCE(NEW.agent_name, 'AI Assistant'),
      agent_description = NEW.widget_settings->>'agent_description',
      logo_url = NEW.widget_settings->>'logo_url',
      logo_storage_path = NEW.widget_settings->>'logo_storage_path',
      settings = jsonb_build_object(
        'agent_name', COALESCE(NEW.agent_name, 'AI Assistant'),
        'agent_description', NEW.widget_settings->>'agent_description',
        'logo_url', NEW.widget_settings->>'logo_url',
        'logo_storage_path', NEW.widget_settings->>'logo_storage_path',
        'updated_at', NOW()
      ),
      updated_at = NOW()
    WHERE client_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for the update function if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_ai_agent_trigger'
  ) THEN
    CREATE TRIGGER update_ai_agent_trigger
    AFTER UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ai_agent_on_client_update();
  END IF;
END $$;

-- Add script to run this migration
INSERT INTO client_activities (
  client_id,
  activity_type,
  description,
  metadata
)
SELECT 
  id,
  'system_update',
  'Moved agent description to ai_agents table',
  jsonb_build_object(
    'migration_date', NOW(),
    'migration_name', '20240928_fix_client_schema'
  )
FROM clients 
WHERE id = (SELECT MIN(id) FROM clients)
LIMIT 1;
