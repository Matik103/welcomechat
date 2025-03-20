-- Remove any references to "AI Assistant" from the clients table
UPDATE public.clients 
SET 
  agent_name = NULL,
  widget_settings = jsonb_set(
    COALESCE(widget_settings, '{}'::jsonb),
    '{bot_name}',
    to_jsonb('')
  )
WHERE agent_name = 'AI Assistant' 
   OR widget_settings->>'bot_name' = 'AI Assistant';

-- Log the migration
INSERT INTO public.client_activities (
  client_id,
  activity_type,
  description,
  metadata
) VALUES (
  'system',
  'schema_update',
  'Removed all references to "AI Assistant" from clients table',
  '{"migration": "20240321000002_remove_ai_assistant_references"}'
); 