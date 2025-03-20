
# Database Column Fix

This document provides instructions for fixing missing columns in the database tables.

## Background

The application encountered errors related to missing columns in the `clients` and `ai_agents` tables. 
These errors prevented the application from functioning correctly, showing errors like:

```
Failed to create client: Failed to create client: Could not find the 'agent_name' column of 'clients' in the schema cache
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

1. Adds the `agent_name` column to the `clients` table if it doesn't exist.
2. Adds all missing columns to the `ai_agents` table, including:
   - agent_description
   - content
   - url
   - settings
   - query_text
   - response_time_ms
   - is_error
   - error_type
   - error_message
   - error_status
   - logo_url
   - logo_storage_path
   - interaction_type
   - size
   - type
   - uploadDate
   - status
   - topic
   - sentiment
   - embedding
   - ai_prompt

## Troubleshooting

If you encounter any issues:

1. Check that your database connection string is correct in the `.env` file.
2. Verify you have `psql` installed and accessible from your command line.
3. Check the Supabase dashboard to ensure your tables exist and are correctly structured.
4. If issues persist, manually run the SQL script at `supabase/migrations/20240927_fix_missing_columns.sql`.
