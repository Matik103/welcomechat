
-- Create a function to update client with settings in a transaction
CREATE OR REPLACE FUNCTION public.update_client_with_settings(
  p_client_id TEXT,
  p_client_name TEXT,
  p_email TEXT,
  p_agent_name TEXT,
  p_agent_description TEXT DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL,
  p_logo_storage_path TEXT DEFAULT NULL,
  p_settings JSONB DEFAULT NULL
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_settings JSONB;
BEGIN
  -- Start transaction
  BEGIN
    -- First get current settings to merge
    SELECT settings INTO current_settings 
    FROM ai_agents 
    WHERE client_id = p_client_id AND interaction_type = 'config'
    LIMIT 1;
    
    -- Set default if null
    IF current_settings IS NULL THEN
      current_settings := '{}'::JSONB;
    END IF;
    
    -- Update the record
    UPDATE ai_agents
    SET 
      client_name = p_client_name,
      email = p_email,
      name = p_agent_name,
      agent_description = COALESCE(p_agent_description, agent_description),
      logo_url = COALESCE(p_logo_url, logo_url),
      logo_storage_path = COALESCE(p_logo_storage_path, logo_storage_path),
      settings = current_settings || COALESCE(p_settings, '{}'::JSONB),
      updated_at = NOW()
    WHERE 
      client_id = p_client_id AND 
      interaction_type = 'config';
      
    -- Log the activity
    INSERT INTO activities (
      ai_agent_id,
      type,
      metadata
    )
    SELECT 
      id,
      'client_updated',
      jsonb_build_object('message', 'Client information updated', 'client_id', p_client_id)
    FROM ai_agents
    WHERE client_id = p_client_id AND interaction_type = 'config'
    LIMIT 1;
    
    RETURN TRUE;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Error updating client: %', SQLERRM;
      RETURN FALSE;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_client_with_settings TO authenticated;
