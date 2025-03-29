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

async function applyDatabaseMigrations() {
  try {
    console.log('Applying database migrations...');

    // 1. Update activity types enum
    const updateActivityTypesResult = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        -- Drop the existing activity_type enum if it exists
        DROP TYPE IF EXISTS activity_type CASCADE;

        -- Create the new activity_type enum with all valid values
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
        );

        -- Update the activities table to use the new enum
        ALTER TABLE activities
          ALTER COLUMN type TYPE activity_type USING type::activity_type;

        -- Update the ai_agents table to use text instead of enum for type to avoid issues
        ALTER TABLE ai_agents
          ALTER COLUMN type TYPE text;

        -- Add a comment to the enum type for documentation
        COMMENT ON TYPE activity_type IS 'Valid activity types for the application';
      `
    });

    if (updateActivityTypesResult.error) {
      throw new Error(`Failed to update activity types: ${updateActivityTypesResult.error.message}`);
    }

    console.log('Successfully updated activity types');

    // 2. Update RLS policies
    const updateRlsPoliciesResult = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON activities;

        -- Create new policy to allow INSERT operations for authenticated users
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
          );
      `
    });

    if (updateRlsPoliciesResult.error) {
      throw new Error(`Failed to update RLS policies: ${updateRlsPoliciesResult.error.message}`);
    }

    console.log('Successfully updated RLS policies');

    console.log('All database migrations completed successfully!');
    return { success: true };

  } catch (error) {
    console.error('Failed to apply database migrations:', error);
    return { success: false, error };
  }
}

// Run the migrations
applyDatabaseMigrations(); 