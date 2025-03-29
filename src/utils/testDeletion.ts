import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { Resend } from 'resend';

// Load environment variables
dotenv.config();

// Initialize cross-fetch
if (typeof fetch === 'undefined') {
  require('cross-fetch/polyfill');
}

// Create a Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendDeletionNotificationEmail(clientEmail: string, clientName: string, deletionDate: Date) {
  try {
    console.log('Sending deletion notification email to:', clientEmail);
    
    const { data, error } = await resend.emails.send({
      from: 'WelcomeChat <admin@welcome.chat>',
      to: clientEmail,
      subject: 'Account Deletion Notice - WelcomeChat',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Deletion Notice</h2>
          <p>Dear ${clientName},</p>
          <p>We are writing to inform you that your WelcomeChat account has been scheduled for deletion.</p>
          <p>Your account will be permanently deleted on <strong>${deletionDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</strong>.</p>
          <p>If you believe this is a mistake or would like to cancel the deletion, please contact our support team immediately.</p>
          <p>Thank you for using WelcomeChat.</p>
          <p>Best regards,<br>The WelcomeChat Team</p>
        </div>
      `
    });

    if (error) {
      console.error('Failed to send deletion notification email:', error);
      return false;
    }

    console.log('Successfully sent deletion notification email:', data);
    return true;
  } catch (error) {
    console.error('Error sending deletion notification email:', error);
    return false;
  }
}

async function testClientDeletionScheduling() {
  try {
    console.log('Starting client deletion scheduling test...');

    // Create a test client
    const testClient = {
      name: 'Test Agent',
      client_name: 'Test Client',
      email: 'delivered@resend.dev',  // Using Resend's testing email
      company: 'Test Company',
      model: 'gpt-4-turbo-preview',
      status: 'active'
    };

    const { data: client, error: createError } = await supabaseAdmin
      .from('ai_agents')
      .insert([testClient])
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create test client: ${createError.message}`);
    }

    console.log('Created test client:', client);

    // Calculate deletion date (30 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    // Schedule client deletion
    const { error: updateError } = await supabaseAdmin
      .from('ai_agents')
      .update({
        status: 'scheduled_deletion',
        deletion_scheduled_at: deletionDate.toISOString()
      })
      .eq('id', client.id);

    if (updateError) {
      throw new Error(`Failed to schedule client deletion: ${updateError.message}`);
    }

    console.log('Successfully scheduled client deletion');

    // Send deletion notification email
    const emailSent = await sendDeletionNotificationEmail(client.email, client.client_name, deletionDate);
    console.log('Email notification status:', emailSent ? 'Sent' : 'Failed');

    // Record the deletion activity
    const activityData = {
      ai_agent_id: client.id,
      type: 'client_deleted',
      metadata: {
        client_name: client.client_name,
        activity_subtype: 'deletion_scheduled',
        scheduled_deletion_date: deletionDate.toISOString(),
        email_notification_sent: emailSent
      }
    };

    const { error: activityError } = await supabaseAdmin
      .from('activities')
      .insert([activityData]);

    if (activityError) {
      throw new Error(`Failed to record deletion activity: ${activityError.message}`);
    }

    console.log('Successfully recorded deletion activity');

    // Verify the changes
    const { data: verifyClient, error: verifyError } = await supabaseAdmin
      .from('ai_agents')
      .select('status, deletion_scheduled_at')
      .eq('id', client.id)
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify client status: ${verifyError.message}`);
    }

    console.log('Verified client status:', verifyClient);

    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('ai_agent_id', client.id)
      .eq('type', 'client_deleted');

    if (activitiesError) {
      throw new Error(`Failed to verify activities: ${activitiesError.message}`);
    }

    console.log('Verified activity record:', activities);
    console.log('Test completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Run the test
testClientDeletionScheduling(); 