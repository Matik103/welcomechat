-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own clients
CREATE POLICY "Users can read their own clients"
ON clients
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
);

-- Allow authenticated users to insert their own clients
CREATE POLICY "Users can insert their own clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (
    id = auth.uid()
);

-- Allow authenticated users to update their own clients
CREATE POLICY "Users can update their own clients"
ON clients
FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
)
WITH CHECK (
    id = auth.uid()
);

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add DeepSeek-related columns to clients table
DO $$ 
BEGIN
    -- Add deepseek_enabled column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'deepseek_enabled'
    ) THEN
        ALTER TABLE clients 
        ADD COLUMN deepseek_enabled BOOLEAN DEFAULT true;
    END IF;

    -- Add deepseek_model column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'deepseek_model'
    ) THEN
        ALTER TABLE clients 
        ADD COLUMN deepseek_model TEXT DEFAULT 'deepseek-chat';
    END IF;

    -- Add deepseek_settings column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'deepseek_settings'
    ) THEN
        ALTER TABLE clients 
        ADD COLUMN deepseek_settings JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$; 