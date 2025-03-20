
# AI Agents Migration Instructions

This migration addresses TypeScript errors related to the `ai_agents` table in the database. The changes include:

1. Adding missing columns to the `ai_agents` table 
2. Updating TypeScript type definitions in the `AIAgent` interface
3. Fixing database functions for querying agent data
4. Adding proper type definitions for database functions

## Steps to Apply Migration

1. Run the following command to add missing columns to the ai_agents table:

```bash
node scripts/run_add_missing_columns.js
```

2. Restart your development server to apply the TypeScript changes:

```bash
npm run dev
```

## What's Changed

- Updated the `AIAgent` interface with all required properties
- Added missing columns to the `ai_agents` table
- Created/replaced SQL functions for agent data queries
- Added proper TypeScript definitions for database functions

## Troubleshooting

If you encounter any issues after running the migration:

1. Check the console for any errors
2. Verify that all columns exist in your `ai_agents` table by running:
   ```sql
   SELECT column_name FROM information_schema.columns WHERE table_name = 'ai_agents';
   ```
3. Try restarting your development server
4. Check that the migration script ran successfully

For persistent issues, you may need to manually apply the migration by running the SQL in the Supabase dashboard.
