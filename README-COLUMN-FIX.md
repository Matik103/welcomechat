
# Database Column Fix

This document provides instructions for fixing missing columns in the database tables.

## Background

The application is encountering errors related to missing columns in the `clients` and `ai_agents` tables. 
These errors prevent the application from functioning correctly, showing errors like:

```
Property 'agent_name' does not exist on type '...'
Property 'agent_description' does not exist on type '...'
Property 'content' does not exist on type '...'
Property 'settings' does not exist on type '...'
```

## Solution

A migration script has been created to add all missing columns to both tables.

## Running the Migration

Follow these steps to apply the migration:

1. Make sure you have the correct database credentials in your `.env` file:

```
SUPABASE_DB_URL="postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"
```

2. Run the migration script:

```bash
node scripts/run_fix_missing_columns.js
```

3. Restart your development server:

```bash
npm run dev
```

## What the Migration Does

The migration:

1. Adds the `agent_name` column to the `clients` table if it doesn't exist
2. Sets a default value of 'AI Assistant' for any NULL `agent_name` values
3. Adds all missing columns to the `ai_agents` table, including:
   - agent_description
   - content
   - embedding
   - url
   - interaction_type
   - query_text
   - response_time_ms
   - is_error
   - error_type
   - error_message
   - error_status
   - topic
   - sentiment
   - settings
   - logo_url
   - logo_storage_path
   - ai_prompt
   - size
   - type
   - uploadDate
   - status
4. Creates helper functions for common queries and dashboard statistics

## Troubleshooting

If you encounter any issues:

1. Check that your database connection string is correct in the `.env` file
2. Verify you have `psql` installed and accessible from your command line
3. Check the Supabase dashboard to ensure your tables exist and are correctly structured
4. If you're still having TypeScript errors after running the migration, restart your development server or TypeScript server
5. If issues persist, manually run the SQL script at `supabase/migrations/20240927_fix_missing_columns.sql`

## Database Schema Changes

This migration makes the following types of changes:
1. Adds missing columns to the `clients` table
2. Adds missing columns to the `ai_agents` table
3. Updates the TypeScript interface definitions to match the database schema
4. Creates helper functions for common database operations

After running this migration, your application should be free of TypeScript errors related to missing columns.
