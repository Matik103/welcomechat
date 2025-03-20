-- Remove all default references to "AI Assistant" from the database

-- Update the create_new_client function to remove AI Assistant default
CREATE OR REPLACE FUNCTION create_new_client(
  p_client_name TEXT,
  p_email TEXT,
  p_agent_name TEXT DEFAULT NULL,
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
  agent_description TEXT;
BEGIN
  -- Extract agent_description from widget_settings if it exists
  agent_description := p_widget_settings->>'agent_description';
  
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
    agent_description,
    '',
    'config',
    jsonb_build_object(
      'agent_name', p_agent_name,
      'agent_description', agent_description,
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
    'New client created',
    jsonb_build_object(
      'client_name', p_client_name,
      'email', p_email
    )
  );
  
  RETURN new_client_id;
END;
$$;

-- Update the update_ai_agent_on_client_update function
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
      name = NEW.agent_name,
      agent_description = NEW.widget_settings->>'agent_description',
      logo_url = NEW.widget_settings->>'logo_url',
      logo_storage_path = NEW.widget_settings->>'logo_storage_path',
      settings = jsonb_build_object(
        'agent_name', NEW.agent_name,
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

-- Update the create_ai_agent_on_client_create function
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
    NEW.agent_name,
    NEW.widget_settings->>'agent_description',
    '',
    NEW.widget_settings->>'logo_url',
    NEW.widget_settings->>'logo_storage_path',
    jsonb_build_object(
      'agent_name', NEW.agent_name,
      'agent_description', NEW.widget_settings->>'agent_description',
      'logo_url', NEW.widget_settings->>'logo_url',
      'logo_storage_path', NEW.widget_settings->>'logo_storage_path',
      'created_at', NOW()
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log the migration
INSERT INTO public.client_activities (
  client_id,
  activity_type,
  description,
  metadata
) VALUES (
  'system',
  'schema_update',
  'Removed all default references to "AI Assistant" from database functions',
  '{"migration": "20240321000003_remove_all_ai_assistant_defaults"}'
); 