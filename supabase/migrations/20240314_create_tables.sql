-- Drop existing tables if they exist
DROP TABLE IF EXISTS client_temp_passwords CASCADE;
DROP TABLE IF EXISTS client_invitations CASCADE;
DROP TABLE IF EXISTS ai_agents CASCADE;

-- Create the ai_agents table
CREATE TABLE ai_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    name TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ai_agents
CREATE INDEX idx_ai_agents_client_id ON ai_agents(client_id);

-- Create the client_invitations table
CREATE TABLE client_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    token UUID NOT NULL,
    email TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for client_invitations
CREATE INDEX idx_client_invitations_client_id ON client_invitations(client_id);
CREATE INDEX idx_client_invitations_token ON client_invitations(token);
CREATE INDEX idx_client_invitations_email ON client_invitations(email);

-- Create the client_temp_passwords table
CREATE TABLE client_temp_passwords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    email TEXT NOT NULL,
    temp_password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for client_temp_passwords
CREATE INDEX idx_client_temp_passwords_client_id ON client_temp_passwords(client_id);
CREATE INDEX idx_client_temp_passwords_email ON client_temp_passwords(email);

-- Enable RLS and add policies
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_temp_passwords ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for service role
CREATE POLICY "service_role_manage_all" ON ai_agents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_manage_all" ON client_invitations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_manage_all" ON client_temp_passwords FOR ALL TO service_role USING (true) WITH CHECK (true); 