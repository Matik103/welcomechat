import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { Database } from '@/integrations/supabase/types';

// Load environment variables from .env file
config();

// Define valid activity types
enum ActivityType {
  DOCUMENT_ADDED = 'document_added',
  DOCUMENT_REMOVED = 'document_removed',
  DOCUMENT_PROCESSED = 'document_processed',
  DOCUMENT_PROCESSING_FAILED = 'document_processing_failed',
  URL_ADDED = 'url_added',
  URL_REMOVED = 'url_removed',
  URL_PROCESSED = 'url_processed',
  URL_PROCESSING_FAILED = 'url_processing_failed',
  CHAT_MESSAGE_SENT = 'chat_message_sent',
  CHAT_MESSAGE_RECEIVED = 'chat_message_received'
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY || '';

if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

async function sendWelcomeEmail(email: string, clientName: string, chatbotName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'admin@welcome.chat',
      to: email,
      subject: 'Welcome to Welcome.chat!',
      html: `
        <h1>Welcome to Welcome.chat, ${clientName}!</h1>
        <p>Your account has been successfully created.</p>
        <p>Your chatbot "${chatbotName}" is ready to use.</p>
        <p>You can access your dashboard at <a href="https://welcome.chat/dashboard">welcome.chat/dashboard</a></p>
        <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
        <p>Best regards,<br>The Welcome.chat Team</p>
      `,
      // Add text version for better email deliverability
      text: `
Welcome to Welcome.chat, ${clientName}!

Your account has been successfully created.
Your chatbot "${chatbotName}" is ready to use.

You can access your dashboard at: https://welcome.chat/dashboard

If you have any questions, please don't hesitate to reach out to our support team.

Best regards,
The Welcome.chat Team
      `.trim()
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
    
    console.log('Welcome email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

async function createActivity(agentId: string, type: string) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert([
        {
          ai_agent_id: agentId,
          type: ActivityType.DOCUMENT_ADDED,
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

async function createAgent(clientId: string, name: string, email: string, company: string, description: string) {
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
          description,
          model: 'gpt-4',
          status: 'active',
          type: ActivityType.DOCUMENT_ADDED,
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

async function createNewClient(clientName: string, email: string, chatbotName: string, chatbotDescription: string) {
  try {
    // Check if client exists
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingClient) {
      console.log('Client already exists:', existingClient);
      return existingClient;
    }

    // Create new client
    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert([
        {
          client_name: clientName,
          email,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // Create chatbot agent
    const agent = await createAgent(
      client.id,
      chatbotName,
      email,
      clientName,
      chatbotDescription
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(email, clientName, chatbotName);
      console.log('Welcome email sent to:', email);
    } catch (emailError) {
      // Log error but don't fail the client creation
      console.error('Failed to send welcome email:', emailError);
    }

    console.log('New client and chatbot created successfully:', { client, agent });
    return { client, agent };
  } catch (error) {
    console.error('Error creating new client:', error);
    throw error;
  }
}

// Run the setup with new client details
createNewClient(
  'New Test Client',
  'clientest5@gmail.com',
  'Customer Support Bot',
  'A helpful chatbot for handling customer inquiries and support requests'
)
  .then(result => console.log('Setup result:', result))
  .catch(error => console.error('Setup error:', error)); 