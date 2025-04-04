import { initializeStorage } from '../src/integrations/supabase/client-admin';

async function main() {
  try {
    console.log('Initializing storage buckets...');
    await initializeStorage();
    console.log('Storage buckets initialized successfully');
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    process.exit(1);
  }
}

main(); 