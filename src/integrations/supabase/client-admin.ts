
import { createClient } from '@supabase/supabase-js';
import { Database } from '../supabase/types';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/env';

// Service role client
const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('Initialized supabaseAdmin client with URL:', SUPABASE_URL);

export { supabaseAdmin };
export default supabaseAdmin;
