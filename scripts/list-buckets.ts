import { supabase } from '../src/integrations/supabase/client';

async function listBuckets() {
  try {
    console.log('Listing storage buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }
    
    console.log('Found buckets:', buckets);
  } catch (error) {
    console.error('Error:', error);
  }
}

listBuckets(); 