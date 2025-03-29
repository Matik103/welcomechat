import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function executeSql(query: string, description: string) {
  try {
    // Execute the query directly using the Supabase client
    const { data, error } = await supabaseAdmin.from('activities').select('*').limit(1);
    
    // If we can query the table, it means we have access
    if (!error) {
      // Now execute our actual query
      const { data: result, error: queryError } = await supabaseAdmin.from('activities').select('*').limit(1);
      
      if (queryError) {
        console.error(`Failed to ${description}:`, queryError.message);
        return false;
      }
      
      // Execute the actual query using raw SQL
      const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', { sql_query: query });
      
      if (sqlError) {
        console.error(`Failed to ${description}:`, sqlError.message);
        return false;
      }
      
      console.log(`Successfully ${description}`);
      return true;
    } else {
      console.error('Failed to verify database access:', error.message);
      return false;
    }
  } catch (error) {
    console.error(`Error while ${description}:`, error);
    return false;
  }
}

async function applyDatabaseMigrations() {
  try {
    console.log('Applying database migrations...');

    // 1. Drop existing activity_type enum
    await executeSql(
      'DROP TYPE IF EXISTS activity_type CASCADE;',
      'dropped activity_type enum'
    );

    // 2. Create new activity_type enum
    const createEnumSuccess = await executeSql(`
      CREATE TYPE activity_type AS ENUM (
        'document_added',
        'document_removed',
        'document_processed',
        'document_processing_failed',
        'url_added',
        'url_removed',
        'url_processed',
        'url_processing_failed',
        'chat_message_sent',
        'chat_message_received',
        'client_created',
        'client_updated',
        'client_deleted',
        'client_recovered',
        'agent_created',
        'agent_updated',
        'agent_deleted',
        'agent_name_updated',
        'agent_description_updated',
        'agent_error',
        'agent_logo_updated',
        'webhook_sent',
        'email_sent',
        'invitation_sent',
        'invitation_accepted',
        'widget_previewed',
        'user_role_updated',
        'login_success',
        'login_failed',
        'signed_out',
        'widget_settings_updated',
        'logo_uploaded',
        'system_update',
        'source_deleted',
        'source_added'
      );`,
      'created new activity_type enum'
    );

    if (!createEnumSuccess) {
      throw new Error('Failed to create new activity_type enum');
    }

    // 3. Update activities table
    const updateActivitiesSuccess = await executeSql(
      'ALTER TABLE activities ALTER COLUMN type TYPE activity_type USING type::activity_type;',
      'updated activities table'
    );

    if (!updateActivitiesSuccess) {
      throw new Error('Failed to update activities table');
    }

    // 4. Update ai_agents table
    const updateAgentsSuccess = await executeSql(
      'ALTER TABLE ai_agents ALTER COLUMN type TYPE text;',
      'updated ai_agents table'
    );

    if (!updateAgentsSuccess) {
      throw new Error('Failed to update ai_agents table');
    }

    // 5. Add enum documentation
    const addDocSuccess = await executeSql(
      "COMMENT ON TYPE activity_type IS 'Valid activity types for the application';",
      'added enum documentation'
    );

    if (!addDocSuccess) {
      throw new Error('Failed to add enum documentation');
    }

    // 6. Update RLS policies
    await executeSql(
      'DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON activities;',
      'dropped existing policy'
    );

    const createPolicySuccess = await executeSql(`
      CREATE POLICY "Enable insert access for authenticated users" ON activities
        FOR INSERT
        TO public
        WITH CHECK (
          auth.role() = 'authenticated' AND (
            -- Allow activities for agents where user's email matches
            ai_agent_id IN (
              SELECT id FROM ai_agents WHERE email = auth.jwt() ->> 'email'
            )
            OR
            -- Allow activities for client deletions and updates
            type IN ('client_deleted', 'client_updated', 'client_created', 'client_recovered')
          )
        );`,
      'created new policy'
    );

    if (!createPolicySuccess) {
      throw new Error('Failed to create new policy');
    }

    console.log('All database migrations completed successfully!');
    return { success: true };

  } catch (error) {
    console.error('Failed to apply database migrations:', error);
    return { success: false, error };
  }
}

// Run the migrations
applyDatabaseMigrations(); 