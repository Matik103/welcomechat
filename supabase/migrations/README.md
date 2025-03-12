# AI Agent Vector Search Setup

This directory contains the database migrations for setting up the AI agent vector search functionality.

## Migration Files

1. `20240319000000_create_match_documents_function.sql`
   - Creates the base match_documents function
   - Sets up security and stability markers

2. `20240319000001_create_agent_specific_functions.sql`
   - Creates functions for generating agent-specific match functions
   - Sets up automatic function creation trigger

3. `20240319000002_setup_ai_agents_table.sql`
   - Creates the ai_agents table
   - Sets up indexes and RLS policies
   - Configures permissions for n8n

4. `20240319000003_create_helper_functions.sql`
   - Creates helper functions for n8n integration
   - Sets up views for easy function listing

## n8n Integration

### Using in n8n

1. **List Available Functions**:
   ```sql
   SELECT * FROM available_agent_functions;
   ```

2. **Using Match Functions**:
   - In Supabase node, select "Function"
   - Choose the function named `match_documents_[clientID]_[agentName]`
   - Parameters:
     - query_embedding: vector[1536]
     - similarity_threshold: float (default: 0.7)
     - match_count: int (default: 5)

3. **Inserting Data**:
   ```sql
   INSERT INTO ai_agents (client_id, agent_name, content, embedding, metadata)
   VALUES (...);
   ```

### Security

- All functions use `security definer`
- RLS policies ensure proper access
- Each agent's data is isolated

### Performance

- Indexes on (client_id, agent_name)
- Vector similarity index using ivfflat
- Automatic function creation on agent creation

## Testing

To test the setup:

1. Create a test agent:
   ```sql
   INSERT INTO ai_agents (client_id, agent_name) 
   VALUES ('your-client-id', 'Test Agent');
   ```

2. Verify function creation:
   ```sql
   SELECT * FROM available_agent_functions
   WHERE client_id = 'your-client-id';
   ```

3. Test vector search:
   ```sql
   SELECT * FROM match_documents_[clientID]_[agentName](
     '[your-embedding]'::vector(1536)
   );
   ``` 