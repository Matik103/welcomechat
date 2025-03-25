import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { OpenAIAssistantService } from './src/utils/OpenAIAssistantService.js';

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
    
    // First, create the test user with the exact credentials from the welcome email
    console.log('Creating test user with welcome email credentials...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'testao@gmail.com',
      password: 'Welcome2025#291',
      options: {
        data: {
          assistant_name: 'testao' // Adding the AI assistant name as metadata
        }
      }
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('Failed to create test user:', signUpError);
      return;
    }

    // Sign in with the temporary credentials
    console.log('Signing in with temporary credentials...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testao@gmail.com',
      password: 'Welcome2025#291'
    });

    if (authError) {
      console.error('Authentication failed:', authError);
      return;
    }

    console.log('Successfully authenticated as:', authData.user.email);

    // Create an AI agent for the user
    console.log('Creating AI agent...');
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .insert([
        {
          name: 'testao',
          description: 'AI Assistant for document processing',
          user_id: authData.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (agentError) {
      console.error('Failed to create AI agent:', agentError);
      return;
    }

    console.log('Created AI agent:', agent.name);

    // Create a test document processing job
    console.log('Creating test document processing job...');
    const { data: jobData, error: jobError } = await supabase
      .from('document_processing_jobs')
      .insert([
        {
          client_id: agent.id,
          status: 'completed',
          content: 'This is a test document content for the AI assistant.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create document processing job:', jobError);
      return;
    }

    console.log('Created document processing job:', jobData.id);

    // Create OpenAI Assistant
    console.log('Creating OpenAI Assistant...');
    const assistant = await openAIAssistant.createAssistant({
      name: agent.name,
      description: agent.description,
      content: jobData.content
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
      content: 'Updated test document content for the AI assistant.'
    });

    console.log('Assistant updated successfully:', updatedAssistant.id);

    // Clean up
    console.log('Cleaning up test data...');
    
    // Delete the OpenAI Assistant
    await openAIAssistant.deleteAssistant(assistant.id);
    console.log('Assistant deleted successfully');

    // Delete the test data from Supabase
    await supabase.from('document_processing_jobs').delete().eq('id', jobData.id);
    await supabase.from('ai_agents').delete().eq('id', agent.id);
    console.log('Test data cleaned up successfully');

    console.log('Test completed successfully!');

  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testAssistantCreation(); 