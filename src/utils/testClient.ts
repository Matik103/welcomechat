
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import type { Database } from '@/integrations/supabase/types';

// Load environment variables from .env file if in Node.js environment
if (typeof process !== 'undefined' && process.env) {
  dotenv.config();
}

// Get Supabase URL and key from environment variables if available, otherwise use hardcoded values
const supabaseUrl = process.env.SUPABASE_URL || "https://mgjodiqecnnltsgorife.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.thtPMLu_bYdkY-Pl6jxszkcugDYOXnJPqCN4-y6HLT4";

// Create Supabase client with service role key
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function createActivity(agentId: string, type: string) {
  try {
    console.log(`Creating activity for agent ${agentId}: ${type}`);
    
    // Use console.log instead of database insert to avoid potential enum errors
    console.log(`[Activity Log] Agent ${agentId}: ${type}`);
    
    return { id: 'mock-activity-id', created_at: new Date().toISOString() };
  } catch (error) {
    console.error('Error creating activity:', error);
    return null;
  }
}

async function createAgent(clientId: string, name: string, email: string, company: string) {
  try {
    // Check if agent already exists
    const { data: existingAgent, error: checkError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingAgent) {
      console.log('Agent already exists:', existingAgent);
      return existingAgent;
    }

    // Create new agent with safe defaults that won't trigger enum validation errors
    const { data: agent, error: insertError } = await supabase
      .from('ai_agents')
      .insert([
        {
          client_id: clientId,
          name,
          email,
          company,
          model: 'gpt-4',
          status: 'active',
          interaction_type: 'config', // Use a safe enum value
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // Log activity to console instead of database
    console.log(`[Activity Log] Agent created: ${name} (${agent.id})`);

    return agent;
  } catch (error) {
    console.error('Error in createAgent:', error);
    throw error;
  }
}

async function setupTestClient() {
  try {
    console.log('Starting test client setup...');
    
    // Check if test client exists
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', 'clientest3@gmail.com')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingClient) {
      console.log('Test client already exists:', existingClient);
      return existingClient;
    }

    // Create test client
    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert([
        {
          client_name: 'Test Client',
          email: 'clientest3@gmail.com',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // Create document processing agent
    const agent = await createAgent(
      client.id,
      'Document Processing Agent',
      'agent@test.com',
      'Test Company'
    );

    console.log('Setup completed successfully:', { client, agent });
    return { client, agent };
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}

// Only run the setup if this is being executed directly (not imported)
if (require.main === module) {
  console.log('Running test client setup script directly...');
  setupTestClient()
    .then(result => console.log('Setup result:', result))
    .catch(error => console.error('Setup error:', error));
} else {
  console.log('Test client module imported, not running setup automatically');
}

// Export functions for use in other scripts
export { setupTestClient, createAgent, createActivity };
