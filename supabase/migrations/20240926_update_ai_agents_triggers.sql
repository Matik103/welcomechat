
-- Create function for creating AI agents on client creation if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_ai_agent_on_client_create()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ai_agents (
    client_id,
    name,
    agent_description,
    content,
    logo_url,
    logo_storage_path,
    settings
  ) VALUES (
    NEW.id,
    COALESCE(NEW.agent_name, 'AI Assistant'),
    NEW.widget_settings->>'agent_description',
    '',
    NEW.widget_settings->>'logo_url',
    NEW.widget_settings->>'logo_storage_path',
    jsonb_build_object(
      'agent_name', COALESCE(NEW.agent_name, 'AI Assistant'),
      'agent_description', NEW.widget_settings->>'agent_description',
      'logo_url', NEW.widget_settings->>'logo_url',
      'logo_storage_path', NEW.widget_settings->>'logo_storage_path',
      'created_at', NOW()
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS create_ai_agent_trigger ON public.clients;

-- Add a trigger to create an AI agent whenever a new client is created
CREATE TRIGGER create_ai_agent_trigger
AFTER INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.create_ai_agent_on_client_create();

-- Create function to update AI agent when client is updated
CREATE OR REPLACE FUNCTION public.update_ai_agent_on_client_update()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS update_ai_agent_trigger ON public.clients;

-- Add a trigger to update the AI agent when client info is updated
CREATE TRIGGER update_ai_agent_trigger
AFTER UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_ai_agent_on_client_update();

-- Update existing clients to have AI agents, if they don't already
INSERT INTO public.ai_agents (client_id, name, agent_description, content, logo_url, logo_storage_path, settings)
SELECT 
  c.id,
  COALESCE(c.agent_name, 'AI Assistant'),
  c.widget_settings->>'agent_description',
  '',
  c.widget_settings->>'logo_url',
  c.widget_settings->>'logo_storage_path',
  jsonb_build_object(
    'agent_name', COALESCE(c.agent_name, 'AI Assistant'),
    'agent_description', c.widget_settings->>'agent_description',
    'logo_url', c.widget_settings->>'logo_url',
    'logo_storage_path', c.widget_settings->>'logo_storage_path',
    'created_at', NOW()
  )
FROM public.clients c
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_agents a WHERE a.client_id = c.id
);
