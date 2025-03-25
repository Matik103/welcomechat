const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { OpenAIAssistantService } = require('./src/utils/OpenAIAssistantService');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Initialize OpenAI Assistant service
const openAIAssistant = new OpenAIAssistantService({
  apiKey: process.env.OPENAI_API_KEY || ''
});

async function testAssistantCreation() {
  try {
    console.log('Starting OpenAI Assistant test...');
    
    // Sign in with test user
    console.log('Signing in with test user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL || 'testao@gmail.com',
      password: process.env.TEST_USER_PASSWORD || 'Welcome2025#291'
    });

    if (authError) {
      console.error('Authentication failed:', authError);
      return;
    }

    console.log('Successfully authenticated as:', authData.user.email);

    // Get the latest document processing job
    console.log('Fetching latest document processing job...');
    const { data: processingJobs, error: processingError } = await supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (processingError) {
      console.error('Failed to fetch processing jobs:', processingError);
      return;
    }

    if (!processingJobs || processingJobs.length === 0) {
      console.error('No completed processing jobs found');
      return;
    }

    const latestJob = processingJobs[0];
    console.log('Found latest processing job:', latestJob.id);

    // Get the associated AI agent
    console.log('Fetching associated AI agent...');
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', latestJob.client_id)
      .single();

    if (agentError) {
      console.error('Failed to fetch AI agent:', agentError);
      return;
    }

    console.log('Found AI agent:', agent.name);

    // Create OpenAI Assistant
    console.log('Creating OpenAI Assistant...');
    const assistant = await openAIAssistant.createAssistant({
      name: agent.name,
      description: agent.description || 'AI Assistant for document processing',
      content: latestJob.content || 'No content available'
    });

    console.log('Assistant created successfully:', assistant.id);

    // Update the AI agent with the assistant ID
    console.log('Updating AI agent with assistant ID...');
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({
        assistant_id: assistant.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', agent.id);

    if (updateError) {
      console.error('Failed to update AI agent:', updateError);
      return;
    }

    console.log('AI agent updated successfully');

    // Test updating the assistant with new content
    console.log('Testing assistant update...');
    const updatedAssistant = await openAIAssistant.updateAssistant(assistant.id, {
      content: latestJob.content || 'Updated content'
    });

    console.log('Assistant updated successfully:', updatedAssistant.id);

    // Test deleting the assistant
    console.log('Testing assistant deletion...');
    await openAIAssistant.deleteAssistant(assistant.id);
    console.log('Assistant deleted successfully');

    console.log('Test completed successfully!');

  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testAssistantCreation(); 