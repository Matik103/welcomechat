
# AI Agents Migration Instructions

This migration addresses TypeScript errors related to the `ai_agents` table in the database. The changes include:

1. Adding the `ai_agents` table to the database schema
2. Updating TypeScript type definitions to include ai_agents
3. Fixing type conversion issues in document processing services
4. Updating WidgetPosition type to include 'left' and 'right' positions

## Steps to Apply Migration

1. Run the following command to create the ai_agents table in the database:

```bash
node scripts/add-ai-agents-table.js
```

2. Restart your development server to apply the TypeScript changes:

```bash
npm run dev
```

## What's Changed

- Added AIAgent interface in the Database type definition
- Updated WidgetPosition type to include 'left' and 'right'
- Fixed type conversion for IDs from number to string
- Created a migration script to add the ai_agents table to the database
- Created a migration SQL file for the ai_agents table

## Troubleshooting

If you encounter any issues after running the migration:

1. Check the console for any errors
2. Verify that the ai_agents table was created in your Supabase database
3. Try restarting your development server

For persistent issues, you may need to manually apply the migration by running the SQL in the Supabase dashboard.
