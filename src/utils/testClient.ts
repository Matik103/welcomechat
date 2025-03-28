import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { Database } from '@/integrations/supabase/types';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
config();

// Define valid activity types
export enum ActivityType {
  DocumentAdded = 'document_added',
  DocumentRemoved = 'document_removed',
  DocumentProcessed = 'document_processed',
  DocumentProcessingFailed = 'document_processing_failed',
  UrlAdded = 'url_added',
  UrlRemoved = 'url_removed',
  UrlProcessed = 'url_processed',
  UrlProcessingFailed = 'url_processing_failed',
  ChatMessageSent = 'chat_message_sent',
  ChatMessageReceived = 'chat_message_received'
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY || '';

if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

async function sendWelcomeEmail(email: string, clientName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Welcome <welcome@welcome.com>',
      to: email,
      subject: 'Welcome to Welcome!',
      html: `
        <h1>Welcome ${clientName}!</h1>
        <p>Thank you for joining Welcome. We're excited to have you on board.</p>
        <p>You can now start using our platform to manage your documents and chat with your AI assistant.</p>
      `
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }

    console.log('Welcome email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

async function createActivity(agentId: string, type: ActivityType, description: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert([
        {
          ai_agent_id: agentId,
          type: type,
          metadata: { description }
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      return null;
    }

    console.log('Activity created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating activity:', error);
    return null;
  }
}

async function createAgent(clientId: string, name: string, description: string) {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .insert([
        {
          client_id: clientId,
          name: name,
          description: description,
          type: ActivityType.DocumentAdded
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      return null;
    }

    console.log('Agent created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating agent:', error);
    return null;
  }
}

export async function createNewClient(
  clientName: string,
  email: string,
  chatbotName: string,
  chatbotDescription: string
) {
  try {
    // Create client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert([
        {
          client_name: clientName,
          email: email,
          status: 'active'
        }
      ])
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      return null;
    }

    // Send welcome email
    await sendWelcomeEmail(email, clientName);

    // Create chatbot agent
    const agent = await createAgent(client.id, chatbotName, chatbotDescription);

    if (!agent) {
      console.error('Failed to create chatbot agent');
      return null;
    }

    // Create activity for agent creation
    await createActivity(
      agent.id,
      ActivityType.DocumentAdded,
      `Chatbot agent ${chatbotName} created`
    );

    return { client, agent };
  } catch (error) {
    console.error('Error in createNewClient:', error);
    return null;
  }
}

// Function to setup test client
export async function setupTestClient() {
  const result = await createNewClient(
    'Test Client',
    'test@example.com',
    'Test Chatbot',
    'A test chatbot for development'
  );

  if (result) {
    console.log('Test client setup successful:', result);
  } else {
    console.error('Test client setup failed');
  }

  return result;
}

// Run setup if this file is executed directly
if (import.meta.url === fileURLToPath(process.argv[1])) {
  setupTestClient();
}
