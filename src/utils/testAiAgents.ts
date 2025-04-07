import { supabase } from "@/integrations/supabase/client";
import { setupDeepSeekAssistant } from "./clientDeepSeekUtils";

async function testAiAgents() {
  try {
    console.log('Starting AI agents test...');

    // First, create a test client
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert([
        {
          name: 'Test Client',
          description: 'A test client for AI agent testing'
        }
      ])
      .select()
      .single();

    if (clientError) {
      console.error('Error creating test client:', clientError);
      return;
    }

    console.log('Test client created:', clientData);

    // Create an AI agent for the client
    const result = await setupDeepSeekAssistant(
      clientData.id,
      'Test Assistant',
      'A test assistant for demonstration purposes',
      clientData.name
    );

    if (!result.success) {
      console.error('Failed to create AI agent:', result.message);
      return;
    }

    console.log('AI agent created successfully:', result);

    // Verify the AI agent was created
    const { data: agentData, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('client_id', clientData.id)
      .eq('interaction_type', 'config')
      .single();

    if (agentError) {
      console.error('Error fetching AI agent:', agentError);
      return;
    }

    console.log('AI agent details:', agentData);

    // Clean up test data
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientData.id);

    if (deleteError) {
      console.error('Error cleaning up test data:', deleteError);
    } else {
      console.log('Test data cleaned up successfully');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testAiAgents(); 