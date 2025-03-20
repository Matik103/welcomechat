
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkAndRefreshAuth } from "@/services/authService";
import { getCurrentWidgetSettings } from "../widget/widgetStorageUtils";

/**
 * Uploads a logo file to Supabase storage and returns the public URL
 */
export async function uploadWidgetLogo(file: File, clientId: string): Promise<{ publicUrl: string, storagePath: string }> {
  if (!file || !clientId) {
    throw new Error("File and client ID are required");
  }

  // Refresh auth token before attempting upload
  const isAuthValid = await checkAndRefreshAuth();
  if (!isAuthValid) {
    throw new Error("Authentication session expired. Please refresh the page and try again.");
  }

  console.log("Starting logo upload process...");
  
  // Create a unique filename with original extension and client ID
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `${clientId}_${Date.now()}.${fileExt}`;
  console.log("Prepared file name for upload:", fileName);

  // Define storage bucket and path
  const BUCKET_NAME = "widget-logos";
  const filePath = fileName;
  
  console.log(`Uploading logo to ${BUCKET_NAME}/${filePath} storage...`);
  
  try {
    // Check if bucket exists, create it if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`Bucket ${BUCKET_NAME} doesn't exist, creating it...`);
      const { error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
      });
      
      if (bucketError) {
        console.error("Error creating storage bucket:", bucketError);
        throw new Error(`Failed to create storage bucket: ${bucketError.message}`);
      }
    }
    
    // Upload the file to Supabase Storage with proper metadata format
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, { 
        upsert: true,
        contentType: file.type,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error("Logo upload error:", uploadError);
      if (uploadError.message.includes("jwt expired")) {
        throw new Error("Your session has expired. Please refresh the page and try again.");
      }
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log("Logo uploaded successfully. Getting public URL...");

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error("Failed to generate public URL");
      throw new Error("Failed to generate public URL for uploaded logo");
    }

    const publicUrl = publicUrlData.publicUrl;
    console.log("Logo public URL generated:", publicUrl);
    console.log("Logo storage path:", `${BUCKET_NAME}/${filePath}`);

    // Validate the URL
    try {
      new URL(publicUrl);
    } catch (e) {
      console.error("Invalid URL generated:", publicUrl, e);
      throw new Error("Generated URL is invalid");
    }

    // After a successful upload, directly update the widget settings with the logo URL
    const storagePath = `${BUCKET_NAME}/${filePath}`;
    
    // Using the JSONB update approach without the sql method
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        widget_settings: {
          ...(await getCurrentWidgetSettings(clientId)),
          logo_url: publicUrl,
          logo_storage_path: storagePath
        }
      })
      .eq("id", clientId);
      
    if (updateError) {
      console.error("Error updating widget settings with logo URL:", updateError);
    } else {
      console.log("Successfully updated widget settings with logo URL");
    }

    // For backward compatibility, we'll check if the client data has been updated
    setTimeout(async () => {
      try {
        const { data: clientData } = await supabase
          .from("clients")
          .select("widget_settings")
          .eq("id", clientId)
          .single();
        
        console.log("Client data after logo upload:", clientData);
        if (clientData?.widget_settings) {
          const widgetSettings = clientData.widget_settings as any;
          if (widgetSettings.logo_url) {
            console.log("Logo URL from database:", widgetSettings.logo_url);
          }
        }
      } catch (fetchError) {
        console.error("Error fetching client data after logo upload:", fetchError);
      }
    }, 1000); // Check after 1 second

    return { publicUrl, storagePath };
  } catch (error: any) {
    console.error("Error in uploadWidgetLogo:", error);
    
    // Check if it's an auth error
    if (error.message?.includes("jwt") || error.message?.includes("auth") || error.message?.includes("session")) {
      // Try to refresh the auth session
      try {
        await checkAndRefreshAuth();
        throw new Error("Authentication token expired. Please try again after refreshing the page.");
      } catch (refreshError) {
        throw new Error("Your session has expired. Please log in again.");
      }
    }
    
    throw error;
  }
}

/**
 * Handles logo upload event, processes the file and returns the public URL
 */
export async function handleLogoUploadEvent(
  event: React.ChangeEvent<HTMLInputElement>,
  clientId: string | undefined,
  onSuccess: (url: string, storagePath: string) => void,
  onError: (error: Error) => void,
  onStart: () => void,
  onComplete: () => void
): Promise<void> {
  const file = event.target.files?.[0];
  if (!file || !clientId) {
    console.log("No file or clientId available:", { file: !!file, clientId });
    return;
  }

  try {
    onStart();
    
    // Check authentication before upload
    await checkAndRefreshAuth();
    
    // Upload the logo and get public URL
    const { publicUrl, storagePath } = await uploadWidgetLogo(file, clientId);
    
    // Call the success callback with the URL and storage path
    onSuccess(publicUrl, storagePath);
    
    console.log("Logo upload and URL generation complete:", publicUrl);
    console.log("Logo storage path:", storagePath);
  } catch (error: any) {
    console.error("Logo upload process failed:", error);
    onError(error);
    
    // Display user-friendly error message
    if (error.message?.includes("jwt") || error.message?.includes("auth") || error.message?.includes("session")) {
      toast.error("Your session has expired. Please refresh the page and try again.");
    } else {
      toast.error(error.message || "Failed to upload logo");
    }
  } finally {
    onComplete();
  }
}
