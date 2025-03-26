-- Create enum for activity types
CREATE TYPE activity_type AS ENUM (
  'chat_interaction',
  'document_upload',
  'settings_update',
  'agent_status_change',
  'system_event'
);

-- Create client_activities table
CREATE TABLE IF NOT EXISTS client_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_client_activities_client_id ON client_activities(client_id);
CREATE INDEX idx_client_activities_type ON client_activities(type);
CREATE INDEX idx_client_activities_created_at ON client_activities(created_at);

-- Grant necessary permissions
GRANT ALL ON TABLE client_activities TO authenticated;
GRANT ALL ON TABLE client_activities TO service_role; 