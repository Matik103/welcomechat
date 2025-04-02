
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgjodiqecnnltsgorife.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.thtPMLu_bYdkY-Pl6jxszkcugDYOXnJPqCN4-y6HLT4';

export const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}); 
