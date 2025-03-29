import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

async function testClientDeletionScheduling() {
  try {
    console.log('Starting client deletion scheduling test...');

    // 1. Create a test client
    const testClientId = uuidv4();
    const testClientEmail = `test${Date.now()}@example.com`;
    
    const { data: client, error: clientError } = await supabaseAdmin
      .from('ai_agents')
      .insert({
        id: testClientId,
        client_name: 'Test Client',
        email: testClientEmail,
        status: 'active',
        name: 'Test Agent',
        company: 'Test Company'
      })
      .select()
      .single();

    if (clientError) {
      throw new Error(`Failed to create test client: ${clientError.message}`);
    }

    console.log('Created test client:', client);

    // 2. Schedule deletion
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const deletionDate = thirtyDaysFromNow.toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('ai_agents')
      .update({ 
        deletion_scheduled_at: deletionDate,
        status: 'scheduled_deletion'
      })
      .eq('id', testClientId);

    if (updateError) {
      throw new Error(`Failed to schedule client deletion: ${updateError.message}`);
    }

    console.log('Successfully scheduled client deletion');

    // 3. Record activity
    const { error: activityError } = await supabaseAdmin
      .from('activities')
      .insert({
        ai_agent_id: testClientId,
        type: 'client_deleted',
        metadata: {
          scheduled_deletion_date: deletionDate,
          client_name: 'Test Client',
          activity_subtype: 'deletion_scheduled'
        }
      });

    if (activityError) {
      throw new Error(`Failed to record deletion activity: ${activityError.message}`);
    }

    console.log('Successfully recorded deletion activity');

    // 4. Verify the changes
    const { data: verifyClient, error: verifyError } = await supabaseAdmin
      .from('ai_agents')
      .select('*')
      .eq('id', testClientId)
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify client status: ${verifyError.message}`);
    }

    console.log('Verified client status:', {
      status: verifyClient.status,
      deletion_scheduled_at: verifyClient.deletion_scheduled_at
    });

    // 5. Verify activity was recorded
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('ai_agent_id', testClientId)
      .eq('type', 'client_deleted');

    if (activitiesError) {
      throw new Error(`Failed to verify activity: ${activitiesError.message}`);
    }

    console.log('Verified activity record:', activities);

    // Clean up (optional - comment out to keep test data)
    /*
    const { error: cleanupError } = await supabaseAdmin
      .from('ai_agents')
      .delete()
      .eq('id', testClientId);

    if (cleanupError) {
      console.warn('Warning: Failed to clean up test client:', cleanupError);
    }
    */

    console.log('Test completed successfully!');
    return { success: true };

  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error };
  }
}

// Run the test
testClientDeletionScheduling(); 