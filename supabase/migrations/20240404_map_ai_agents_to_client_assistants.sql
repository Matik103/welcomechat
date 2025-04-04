-- Check if the client_assistants table exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'client_assistants'
    ) THEN
        -- First, migrate existing ai_agents data to client_assistants
        INSERT INTO client_assistants (
            id,
            client_id,
            name,
            description,
            settings,
            created_at,
            updated_at
        )
        SELECT 
            id,
            client_id,
            name,
            agent_description,
            jsonb_build_object(
                'ai_prompt', ai_prompt,
                'model', model,
                'company', company,
                'email', email,
                'status', status,
                'interaction_type', interaction_type,
                'is_active', is_active,
                'openai_assistant_id', openai_assistant_id,
                'logo_url', logo_url
            ),
            created_at,
            updated_at
        FROM ai_agents
        ON CONFLICT (client_id, name) DO UPDATE
        SET
            description = EXCLUDED.description,
            settings = client_assistants.settings || EXCLUDED.settings,
            updated_at = EXCLUDED.updated_at;

        -- Create a view to maintain backward compatibility
        CREATE OR REPLACE VIEW public.ai_agents_view AS
        SELECT 
            ca.id,
            ca.client_id,
            ca.name,
            ca.description as agent_description,
            (ca.settings->>'ai_prompt')::text as ai_prompt,
            (ca.settings->>'model')::text as model,
            (ca.settings->>'company')::text as company,
            (ca.settings->>'email')::text as email,
            (ca.settings->>'status')::text as status,
            (ca.settings->>'interaction_type')::text as interaction_type,
            (ca.settings->>'is_active')::boolean as is_active,
            (ca.settings->>'openai_assistant_id')::text as openai_assistant_id,
            (ca.settings->>'logo_url')::text as logo_url,
            ca.created_at,
            ca.updated_at
        FROM client_assistants ca;

        -- Create RLS policies for the view
        ALTER VIEW public.ai_agents_view SECURITY DEFINER;

        CREATE POLICY "Users can view their own agents"
        ON public.client_assistants FOR SELECT
        TO authenticated
        USING (auth.uid()::text = client_id::text);

        CREATE POLICY "Users can manage their own agents"
        ON public.client_assistants FOR ALL
        TO authenticated
        USING (auth.uid()::text = client_id::text)
        WITH CHECK (auth.uid()::text = client_id::text);

        -- Update website_urls foreign key if the table exists
        IF EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'website_urls'
        ) THEN
            ALTER TABLE website_urls
            DROP CONSTRAINT IF EXISTS website_urls_client_id_fkey,
            ADD CONSTRAINT website_urls_client_id_fkey 
                FOREIGN KEY (client_id) 
                REFERENCES client_assistants(id) 
                ON DELETE CASCADE;
        END IF;

        -- Update client_activities foreign key if the table exists
        IF EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'client_activities'
        ) THEN
            ALTER TABLE client_activities
            DROP CONSTRAINT IF EXISTS client_activities_client_id_fkey,
            ADD CONSTRAINT client_activities_client_id_fkey 
                FOREIGN KEY (client_id) 
                REFERENCES client_assistants(id) 
                ON DELETE CASCADE;
        END IF;

        -- Create function to handle assistant document uploads
        CREATE OR REPLACE FUNCTION handle_assistant_document_upload()
        RETURNS trigger AS $$
        BEGIN
            -- Log the activity
            INSERT INTO client_activities (
                client_id,
                activity_type,
                activity_data,
                description
            )
            VALUES (
                NEW.assistant_id,
                'document_added',
                jsonb_build_object(
                    'document_id', NEW.id,
                    'filename', NEW.filename,
                    'file_type', NEW.file_type,
                    'status', NEW.status
                ),
                'Document uploaded: ' || NEW.filename
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger for document uploads
        DROP TRIGGER IF EXISTS assistant_document_upload_trigger ON assistant_documents;
        CREATE TRIGGER assistant_document_upload_trigger
            AFTER INSERT ON assistant_documents
            FOR EACH ROW
            EXECUTE FUNCTION handle_assistant_document_upload();

        -- Grant necessary permissions
        GRANT SELECT ON public.ai_agents_view TO authenticated;
        GRANT ALL ON public.client_assistants TO authenticated;
        GRANT ALL ON public.assistant_documents TO authenticated;
        GRANT ALL ON public.website_urls TO authenticated;
        GRANT ALL ON public.client_activities TO authenticated;
    ELSE
        RAISE EXCEPTION 'The client_assistants table does not exist. Please run the create_client_assistants migration first.';
    END IF;
END $$; 