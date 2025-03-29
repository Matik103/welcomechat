
-- Update the saveClientTempPassword function to use Supabase Auth properly
CREATE OR REPLACE FUNCTION public.on_client_created()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new client is created, add an entry for login credentials in client_temp_passwords
  -- This will track the temporary passwords for clients
  INSERT INTO client_temp_passwords (
    agent_id,
    email,
    temp_password,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    md5(random()::text || clock_timestamp()::text)::text, -- Generate a random password
    NOW()
  );
  
  -- Log the client creation
  INSERT INTO client_activities (
    client_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    NEW.id,
    'client_created',
    'New client created with AI agent: ' || COALESCE(NEW.agent_name, 'AI Assistant'),
    jsonb_build_object(
      'agent_name', NEW.agent_name,
      'email', NEW.email
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to handle client creation
DROP TRIGGER IF EXISTS on_client_created ON ai_agents;
CREATE TRIGGER on_client_created
AFTER INSERT ON ai_agents
FOR EACH ROW
WHEN (NEW.interaction_type = 'config')
EXECUTE FUNCTION on_client_created();
