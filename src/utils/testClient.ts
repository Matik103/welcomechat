import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = "https://mgjodiqecnnltsgorife.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.thtPMLu_bYdkY-Pl6jxszkcugDYOXnJPqCN4-y6HLT4";

// Create Supabase client with service role key
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function createActivity(agentId: string, type: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert([
        {
          ai_agent_id: agentId,
          type: 'document_added',
          metadata: { message: type }
        }
      ])
      .select();

    if (error) throw error;
    return data;
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

    // Create new agent
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // Log activity
    await createActivity(agent.id, 'Agent created');

    return agent;
  } catch (error) {
    console.error('Error in createAgent:', error);
    throw error;
  }
}

async function setupTestClient() {
  try {
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

// Run the setup
setupTestClient()
  .then(result => console.log('Setup result:', result))
  .catch(error => console.error('Setup error:', error)); 