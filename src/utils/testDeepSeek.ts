import { setupDeepSeekAssistant, sendQueryToDeepSeek } from '@/services/aiService';
import { supabase } from '@/integrations/supabase/client';

async function testDeepSeek() {
  try {
    // First, get a real client ID from the database
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);

    if (clientsError || !clients?.length) {
      console.error('Failed to get client:', clientsError);
      return;
    }

    const client = clients[0];
    console.log('Using client:', client);

    // Test assistant details
    const agentName = 'Test Assistant';
    const agentDescription = 'A test assistant for DeepSeek integration';

    console.log('\nCreating DeepSeek assistant...');
    const setupResult = await setupDeepSeekAssistant(
      client.id,
      agentName,
      agentDescription,
      client.name
    );

    if (!setupResult.success) {
      console.error('Failed to create assistant:', setupResult.message);
      return;
    }

    console.log('Assistant created successfully:', setupResult);

    // Test query
    const testQuery = 'Hello! Can you tell me about yourself?';
    console.log('\nSending test query:', testQuery);
    
    const response = await sendQueryToDeepSeek(client.id, testQuery);
    console.log('\nResponse:', response);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testDeepSeek(); 