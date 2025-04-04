import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createTestUser() {
  try {
    // Create test user
    const email = `test${Date.now()}@example.com`;
    const password = 'testpassword123';

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return;
    }

    console.log('Created test user:', userData.user);

    // Create test AI agent
    const { data: agentData, error: agentError } = await supabase
      .from('ai_agents')
      .insert({
        name: 'Test Agent',
        email: email,
        company: 'Test Company',
        model: 'gpt-4',
        status: 'active',
        interaction_type: 'config',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (agentError) {
      console.error('Error creating AI agent:', agentError);
      return;
    }

    console.log('Created AI agent:', agentData);
    console.log('\nTest credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Agent ID:', agentData.id);

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createTestUser(); 