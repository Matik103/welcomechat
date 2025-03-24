import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://mgjodiqecnnltsgorife.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.thtPMLu_bYdkY-Pl6jxszkcugDYOXnJPqCN4-y6HLT4";

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTestClient() {
  try {
    console.log('Starting test client setup...');
    
    // First check if the test client already exists
    const { data: existingClient, error: findError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('email', 'test@example.com')
      .eq('interaction_type', 'config')
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error checking for existing client:', findError);
      return;
    }

    let client;
    if (existingClient) {
      console.log('Found existing test client:', existingClient);
      client = existingClient;
    } else {
      console.log('Creating new test client...');
      const { data: newClient, error: clientError } = await supabase
        .from('ai_agents')
        .insert({
          name: 'Test Agent',
          client_name: 'Test Client',
          email: 'test@example.com',
          company: 'Test Company',
          interaction_type: 'config',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (clientError) {
        console.error('Error creating client:', clientError);
        console.error('Full error details:', JSON.stringify(clientError, null, 2));
        return;
      }

      console.log('Created new test client:', newClient);
      client = newClient;
    }

    // Create a document processing agent
    console.log('Creating document processing agent...');
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .insert({
        client_id: client.id,
        name: 'Test Agent',
        interaction_type: 'document',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (agentError) {
      console.error('Error creating agent:', agentError);
      console.error('Full error details:', JSON.stringify(agentError, null, 2));
      return;
    }

    console.log('Created document processing agent:', agent);

    return {
      clientId: client.id,
      agentName: 'Test Agent'
    };
  } catch (error) {
    console.error('Error in setupTestClient:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
  }
}

// Run the setup
setupTestClient().then(result => {
  if (result) {
    console.log('\nTest client setup complete. Use these values for document processing:');
    console.log('Client ID:', result.clientId);
    console.log('Agent Name:', result.agentName);
  } else {
    console.log('\nFailed to set up test client and agent.');
  }
}); 