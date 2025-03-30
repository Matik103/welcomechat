
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded service role key as provided
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.thtPMLu_bYdkY-Pl6jxszkcugDYOXnJPqCN4-y6HLT4';

// Create a Supabase client with the service role key for admin operations
export const supabaseAdmin = createClient<Database>(
  'https://mgjodiqecnnltsgorife.supabase.co',
  serviceRoleKey
);

// Also create a supabaseAdmin client without type definitions for simpler usage
export const supabaseAdminWithoutTypes = createClient(
  'https://mgjodiqecnnltsgorife.supabase.co',
  serviceRoleKey
);

console.log('Supabase Admin client initialized with service role key');

// Export the createClient function in case we need to create more clients
export { createClient };

// For backward compatibility - some files might be importing this as 'supabase'
export const supabase = supabaseAdmin;
