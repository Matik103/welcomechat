
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Function to restore essential database tables that were deleted
 */
export async function restoreDeletedTables(): Promise<boolean> {
  try {
    toast.loading("Restoring database tables...");
    
    // First check if essential tables exist
    const { data: tablesData, error: tablesCheckError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT json_build_object('exists', (
            SELECT count(table_name) > 0 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('ai_agents', 'document_content', 'assistant_documents', 'website_urls', 'client_activities')
          )) as result
        `
      });
    
    if (tablesCheckError) {
      console.error("Error checking for tables:", tablesCheckError);
      toast.error("Failed to check database tables");
      return false;
    }
    
    // Check if tables exist
    const tablesExist = tablesData?.[0]?.result?.exists === true;
    
    if (tablesExist) {
      toast.success("Database tables already exist, no restoration needed");
      return true;
    }
    
    console.log("Tables don't exist. Starting restoration process...");
    
    // Create document_content and assistant_documents tables
    const initQuery = `
      -- Create document_content table
      CREATE TABLE IF NOT EXISTS document_content (
        id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        client_id UUID NOT NULL,
        document_id UUID NOT NULL UNIQUE,
        content TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        filename TEXT,
        file_type TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Create assistant_documents table
      CREATE TABLE IF NOT EXISTS assistant_documents (
        id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        document_id UUID NOT NULL REFERENCES document_content(document_id),
        assistant_id TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'error')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_document_content_client_id ON document_content(client_id);
      CREATE INDEX IF NOT EXISTS idx_document_content_document_id ON document_content(document_id);
      CREATE INDEX IF NOT EXISTS idx_assistant_documents_document_id ON assistant_documents(document_id);
      CREATE INDEX IF NOT EXISTS idx_assistant_documents_status ON assistant_documents(status);
      CREATE INDEX IF NOT EXISTS idx_assistant_documents_assistant_id ON assistant_documents(assistant_id);
    `;
    
    // Execute init query
    const { error: initError } = await supabase.rpc('exec_sql', { sql_query: initQuery });
    
    if (initError) {
      console.error("Error recreating document tables:", initError);
      toast.error("Failed to restore document tables");
      return false;
    }
    
    // Restore website_urls and client_activities tables
    const websiteTablesQuery = `
      -- Create client_activities table
      CREATE TABLE IF NOT EXISTS public.client_activities (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          client_id UUID NOT NULL,
          activity_type VARCHAR(255) NOT NULL,
          activity_data JSONB DEFAULT '{}'::jsonb,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
          updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
      );
      
      -- Create website_urls table
      CREATE TABLE IF NOT EXISTS public.website_urls (
          id BIGSERIAL PRIMARY KEY,
          client_id UUID NOT NULL,
          url TEXT NOT NULL,
          refresh_rate INTEGER DEFAULT 30,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
          updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
          last_crawled TIMESTAMPTZ,
          scrapable BOOLEAN DEFAULT true,
          is_sitemap BOOLEAN DEFAULT false,
          scrapability VARCHAR(50),
          error TEXT
      );
      
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON public.client_activities(client_id);
      CREATE INDEX IF NOT EXISTS idx_client_activities_type ON public.client_activities(activity_type);
      CREATE INDEX IF NOT EXISTS idx_website_urls_client_id ON public.website_urls(client_id);
      CREATE INDEX IF NOT EXISTS idx_website_urls_url ON public.website_urls(url);
    `;
    
    const { error: websiteTablesError } = await supabase.rpc('exec_sql', { 
      sql_query: websiteTablesQuery 
    });
    
    if (websiteTablesError) {
      console.error("Error recreating website tables:", websiteTablesError);
      toast.error("Failed to restore website and activity tables");
      return false;
    }
    
    // Create ai_agents table if needed
    const aiAgentsQuery = `
      CREATE TABLE IF NOT EXISTS public.ai_agents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        client_id UUID,
        name TEXT NOT NULL,
        agent_description TEXT,
        client_name TEXT,
        email TEXT,
        logo_url TEXT,
        logo_storage_path TEXT,
        interaction_type TEXT DEFAULT 'config',
        status TEXT DEFAULT 'active',
        settings JSONB DEFAULT '{}'::jsonb,
        content TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        openai_assistant_id TEXT,
        deepseek_assistant_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        deletion_scheduled_at TIMESTAMPTZ,
        last_active TIMESTAMPTZ
      );
      
      CREATE INDEX IF NOT EXISTS idx_ai_agents_client_id ON public.ai_agents(client_id);
      CREATE INDEX IF NOT EXISTS idx_ai_agents_interaction_type ON public.ai_agents(interaction_type);
      CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON public.ai_agents(status);
    `;
    
    const { error: aiAgentsError } = await supabase.rpc('exec_sql', { 
      sql_query: aiAgentsQuery 
    });
    
    if (aiAgentsError) {
      console.error("Error recreating AI agents table:", aiAgentsError);
      toast.error("Failed to restore AI agents table");
      return false;
    }
    
    // Verify that tables were created
    const { data: verifyData, error: verifyError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT json_build_object('tables', (
            SELECT json_agg(table_name) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('ai_agents', 'document_content', 'assistant_documents', 'website_urls', 'client_activities')
          )) as result
        `
      });
      
    if (verifyError) {
      console.error("Error verifying table creation:", verifyError);
      toast.error("Tables may have been restored but verification failed");
      return false;
    }
    
    const restoredTables = verifyData?.[0]?.result?.tables || [];
    console.log("Restored tables:", restoredTables);
    
    if (restoredTables.length === 5) {
      toast.success(`Successfully restored all 5 database tables`);
      return true;
    } else {
      toast.warning(`Partially restored tables: ${restoredTables.length}/5 tables restored`);
      return false;
    }
    
  } catch (error) {
    console.error("Error in table restoration process:", error);
    toast.error(`Table restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}
