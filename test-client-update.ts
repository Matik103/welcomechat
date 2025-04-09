import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testClientUpdate() {
  try {
    // First, get an existing client
    const { data: clients, error: fetchError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('interaction_type', 'config')
      .limit(1);

    if (fetchError) {
      console.error('Error fetching clients:', fetchError);
      return;
    }

    if (!clients || clients.length === 0) {
      console.log('No clients found. Creating a test client first...');
      
      // Create a test client
      const { data: newClient, error: createError } = await supabase
        .from('ai_agents')
        .insert([
          {
            client_name: 'Test Client',
            email: 'test@example.com',
            name: 'Test Agent',
            agent_description: 'A test agent',
            interaction_type: 'config',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            settings: {
              client_name: 'Test Client',
              email: 'test@example.com',
              agent_name: 'Test Agent',
              agent_description: 'A test agent'
            }
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating test client:', createError);
        return;
      }

      console.log('Test client created:', newClient);
      return;
    }

    const client = clients[0];
    console.log('Found existing client:', client);

    // Try to update the client
    const updateData = {
      client_name: 'Updated Test Client',
      email: 'updated@example.com',
      name: 'Updated Test Agent',
      agent_description: 'An updated test agent',
      updated_at: new Date().toISOString(),
      settings: {
        ...(client.settings || {}),
        client_name: 'Updated Test Client',
        email: 'updated@example.com',
        agent_name: 'Updated Test Agent',
        agent_description: 'An updated test agent'
      }
    };

    const { data: updatedClient, error: updateError } = await supabase
      .from('ai_agents')
      .update(updateData)
      .eq('id', client.id)
      .eq('interaction_type', 'config')
      .select()
      .single();

    if (updateError) {
      console.error('Error updating client:', updateError);
      return;
    }

    console.log('Client updated successfully:', updatedClient);
  } catch (error) {
    console.error('Error in testClientUpdate:', error);
  }
}

// Run the test
testClientUpdate(); 