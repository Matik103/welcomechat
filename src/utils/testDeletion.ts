import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('Error: VITE_SUPABASE_SERVICE_ROLE_KEY is not set in .env');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDeletion() {
  try {
    console.log('Starting deletion test with service role...');
    console.log('Using Supabase URL:', supabaseUrl);

    // First, get a user to delete
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (userError) {
      throw new Error(`Error fetching user: ${userError.message}`);
    }

    if (!users || users.length === 0) {
      throw new Error('No users found to delete');
    }

    const user = users[0];
    console.log('Deleting user:', user);

    // Delete the user
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (deleteError) {
      throw new Error(`Error deleting user: ${deleteError.message}`);
    }

    console.log('User deleted successfully');

    // Verify the user was deleted
    const { data: checkUsers, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id);

    if (checkError) {
      throw new Error(`Error checking user: ${checkError.message}`);
    }

    if (checkUsers && checkUsers.length > 0) {
      console.warn('Warning: User still exists after deletion');
    } else {
      console.log('User successfully verified as deleted');
    }

    // Delete the auth user
    const { data: authUsers, error: authError } = await supabase
      .auth.admin.listUsers();

    if (authError) {
      throw new Error(`Error listing auth users: ${authError.message}`);
    }

    const authUserToDelete = authUsers.users.find(authUser => authUser.email === user.email || '');

    if (authUserToDelete) {
      const { error: deleteAuthError } = await supabase
        .auth.admin.deleteUser(authUserToDelete.id);

      if (deleteAuthError) {
        console.warn('Warning: Failed to delete auth user:', deleteAuthError.message);
      } else {
        console.log('Auth user deleted successfully');
      }
    } else {
      console.log('Auth user not found, skipping deletion');
    }

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testDeletion();
