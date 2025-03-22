
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures that required storage buckets exist
 */
export const ensureStorageBuckets = async () => {
  try {
    // Check if document_storage bucket exists
    const { data: buckets, error } = await supabase
      .storage
      .listBuckets();

    if (error) {
      console.error("Error checking storage buckets:", error);
      return;
    }

    const documentStorageBucket = buckets?.find(bucket => bucket.name === 'document_storage');
    
    if (!documentStorageBucket) {
      console.log("Creating document_storage bucket...");
      
      // Create the document_storage bucket
      const { error: createError } = await supabase
        .storage
        .createBucket('document_storage', {
          public: true,
          fileSizeLimit: 10485760, // 10MB limit
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
        });
        
      if (createError) {
        console.error("Error creating document_storage bucket:", createError);
      } else {
        console.log("document_storage bucket created successfully");
      }
    } else {
      console.log("document_storage bucket already exists");
    }
    
    // Check if widget-logos bucket exists
    const widgetLogosBucket = buckets?.find(bucket => bucket.name === 'widget-logos');
    
    if (!widgetLogosBucket) {
      console.log("Creating widget-logos bucket...");
      
      // Create the widget-logos bucket
      const { error: createError } = await supabase
        .storage
        .createBucket('widget-logos', {
          public: true,
          fileSizeLimit: 5242880, // 5MB limit
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
        });
        
      if (createError) {
        console.error("Error creating widget-logos bucket:", createError);
      } else {
        console.log("widget-logos bucket created successfully");
      }
    } else {
      console.log("widget-logos bucket already exists");
    }
  } catch (error) {
    console.error("Error in ensureStorageBuckets:", error);
  }
};
