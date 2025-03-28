import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mgjodiqecnnltsgorife.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.qB6EALQwgkR9BQ2_QR_4MmXFQgFrm17D_yODKmnFE7M";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBucket() {
  try {
    console.log('Creating bucket bot-logos...');
    const { data, error } = await supabase
      .storage
      .createBucket('bot-logos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
      });

    if (error) {
      console.error('Error creating bucket:', error);
      return;
    }

    console.log('Bucket created successfully:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

createBucket(); 