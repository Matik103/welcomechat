-- Add missing columns to document_content table
DO $$ 
BEGIN
    -- Create document_content table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'document_content'
    ) THEN
        CREATE TABLE document_content (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            client_id TEXT NOT NULL,
            document_id UUID NOT NULL,
            content TEXT,
            filename TEXT,
            file_type TEXT,
            storage_url TEXT,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
    ELSE
        -- Add columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'document_content' 
            AND column_name = 'storage_url'
        ) THEN
            ALTER TABLE document_content 
            ADD COLUMN storage_url TEXT;
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'document_content' 
            AND column_name = 'file_type'
        ) THEN
            ALTER TABLE document_content 
            ADD COLUMN file_type TEXT;
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'document_content' 
            AND column_name = 'filename'
        ) THEN
            ALTER TABLE document_content 
            ADD COLUMN filename TEXT;
        END IF;
    END IF;

    -- Create assistant_documents table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'assistant_documents'
    ) THEN
        CREATE TABLE assistant_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            assistant_id TEXT NOT NULL,
            document_id UUID NOT NULL REFERENCES document_content(id),
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
    END IF;

    -- Add RLS policies
    ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;
    ALTER TABLE assistant_documents ENABLE ROW LEVEL SECURITY;

    -- Document content policies
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON document_content;
    CREATE POLICY "Enable read access for authenticated users" 
    ON document_content FOR SELECT 
    TO authenticated 
    USING (true);

    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON document_content;
    CREATE POLICY "Enable insert access for authenticated users" 
    ON document_content FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

    DROP POLICY IF EXISTS "Enable update access for authenticated users" ON document_content;
    CREATE POLICY "Enable update access for authenticated users" 
    ON document_content FOR UPDATE 
    TO authenticated 
    USING (true);

    -- Assistant documents policies
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON assistant_documents;
    CREATE POLICY "Enable read access for authenticated users" 
    ON assistant_documents FOR SELECT 
    TO authenticated 
    USING (true);

    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON assistant_documents;
    CREATE POLICY "Enable insert access for authenticated users" 
    ON assistant_documents FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

    DROP POLICY IF EXISTS "Enable update access for authenticated users" ON assistant_documents;
    CREATE POLICY "Enable update access for authenticated users" 
    ON assistant_documents FOR UPDATE 
    TO authenticated 
    USING (true);

END $$; 