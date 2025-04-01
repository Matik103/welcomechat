
import { supabase } from '@/integrations/supabase/client';

export const createSqlScriptsBucket = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets?.some(bucket => bucket.name === 'sql-scripts')) {
      const { data, error } = await supabase.storage.createBucket('sql-scripts', {
        public: false,
        allowedMimeTypes: ['text/plain', 'application/sql'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error) {
        console.error('Error creating sql-scripts bucket:', error);
        return false;
      }
      
      console.log('Created sql-scripts bucket:', data);
    }
    
    // Upload the SQL file (always refresh it to ensure latest version)
    try {
      const sqlContent = await fetch('/supabase/sql/update_document_links_rls.sql').then(res => res.text());
      
      const { error: uploadError } = await supabase.storage
        .from('sql-scripts')
        .upload('update_document_links_rls.sql', new Blob([sqlContent], { type: 'application/sql' }), {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Error uploading SQL file:', uploadError);
        return false;
      }
      
      console.log('Uploaded SQL file to sql-scripts bucket');
    } catch (fetchError) {
      console.error('Error fetching or uploading SQL file:', fetchError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up sql-scripts bucket:', error);
    return false;
  }
};

// Create a function to initialize SQL resources that can be called during app startup
export const initializeSqlResources = async () => {
  console.log("Initializing SQL resources...");
  const bucketsResult = await createSqlScriptsBucket();
  console.log("SQL scripts bucket initialization result:", bucketsResult);
  return bucketsResult;
};
