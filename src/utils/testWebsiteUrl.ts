import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''; // Use service role key

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testWebsiteUrl() {
  try {
    console.log('Starting website URL test...');

    // First, get a test client ID
    const { data: clients, error: clientError } = await supabase
      .from('ai_agents')
      .select('id, email')
      .limit(1);

    if (clientError) {
      throw new Error(`Error fetching client: ${clientError.message}`);
    }

    if (!clients || clients.length === 0) {
      throw new Error('No test client found');
    }

    const client = clients[0];
    console.log('Using client:', client);

    // Add a test website URL
    const websiteData = {
      client_id: client.id,
      url: 'https://autokey.ca/',
      refresh_rate: 30,
      status: 'pending'
    };

    console.log('Adding website URL:', websiteData);

    const { data: website, error: insertError } = await supabase
      .from('website_urls')
      .insert(websiteData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error inserting website URL: ${insertError.message}`);
    }

    console.log('Website URL added successfully:', website);

    // Log the activity manually
    const activityData = {
      client_id: client.id,
      activity_type: 'website_url_added',
      activity_data: {
        website_id: website.id,
        url: website.url,
        refresh_rate: website.refresh_rate,
        status: website.status
      }
    };

    const { error: activityError } = await supabase
      .from('client_activities')
      .insert(activityData);

    if (activityError) {
      console.warn('Warning: Failed to log activity:', activityError.message);
    } else {
      console.log('Activity logged successfully');
    }

    // Verify the website URL was added
    const { data: websites, error: fetchError } = await supabase
      .from('website_urls')
      .select('*')
      .eq('client_id', client.id);

    if (fetchError) {
      throw new Error(`Error fetching website URLs: ${fetchError.message}`);
    }

    console.log('All website URLs for client:', websites);

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testWebsiteUrl(); 