
-- Create a table for client recovery tokens
CREATE TABLE IF NOT EXISTS client_recovery_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_recovery_tokens_client_id ON client_recovery_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_client_recovery_tokens_token ON client_recovery_tokens(token);

-- Add RLS policies
ALTER TABLE client_recovery_tokens ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own recovery tokens
CREATE POLICY "Allow users to view their recovery tokens"
  ON client_recovery_tokens
  FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT id FROM ai_agents WHERE email = auth.jwt() ->> 'email'
  ));

-- Grant permissions to service role
GRANT ALL ON TABLE client_recovery_tokens TO service_role;

-- Add comment for documentation
COMMENT ON TABLE client_recovery_tokens IS 'Stores tokens for recovering clients scheduled for deletion';
