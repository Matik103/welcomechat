
import { supabase } from "@/integrations/supabase/client";
import { WidgetSettings as IWidgetSettings, defaultSettings } from "@/types/widget-settings";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

/**
 * Converts WidgetSettings object to a JSON structure for database storage
 */
export function convertSettingsToJson(settings: IWidgetSettings): { [key: string]: Json } {
  return {
    agent_name: settings.agent_name || defaultSettings.agent_name,
    logo_url: settings.logo_url || '',
    webhook_url: settings.webhook_url || '',
    chat_color: settings.chat_color || defaultSettings.chat_color,
    background_color: settings.background_color || defaultSettings.background_color,
    text_color: settings.text_color || defaultSettings.text_color,
    secondary_color: settings.secondary_color || defaultSettings.secondary_color,
    position: settings.position || defaultSettings.position,
    welcome_text: settings.welcome_text || defaultSettings.welcome_text,
    response_time_text: settings.response_time_text || defaultSettings.response_time_text
  };
}

/**
 * Uploads a logo file to Supabase storage and returns the public URL
 */
export async function uploadWidgetLogo(file: File, clientId: string): Promise<string> {
  if (!file || !clientId) {
    throw new Error("File and client ID are required");
  }

  console.log("Starting logo upload process...");
  
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `logo_${clientId}_${Date.now()}.${fileExt}`;
  console.log("Prepared file name for upload:", fileName);

  const BUCKET_NAME = "widget-logos";
  const FOLDER_NAME = "Logo URL";
  const filePath = `${FOLDER_NAME}/${fileName}`;
  
  console.log(`Uploading logo to ${BUCKET_NAME}/${filePath} storage...`);
  const { error: uploadError, data: uploadData } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { 
      upsert: true,
      contentType: file.type,
      cacheControl: '3600'
    });

  if (uploadError) {
    console.error("Logo upload error:", uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  console.log("Logo uploaded successfully:", uploadData);

  // Get the full public URL for the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);
  
  if (!publicUrlData || !publicUrlData.publicUrl) {
    console.error("Failed to generate public URL:", publicUrlData);
    throw new Error("Failed to generate public URL for uploaded logo");
  }

  const publicUrl = publicUrlData.publicUrl;
  console.log("Logo public URL generated:", publicUrl);

  // Validate the URL
  try {
    new URL(publicUrl);
  } catch (e) {
    console.error("Invalid URL generated:", publicUrl, e);
    throw new Error("Generated URL is invalid");
  }

  return publicUrl;
}

/**
 * Handles logo upload event, processes the file and returns the public URL
 */
export async function handleLogoUploadEvent(
  event: React.ChangeEvent<HTMLInputElement>,
  clientId: string | undefined,
  onSuccess: (url: string) => void,
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
    
    const publicUrl = await uploadWidgetLogo(file, clientId);
    onSuccess(publicUrl);

  } catch (error: any) {
    console.error("Logo upload process failed:", error);
    onError(error);
  } finally {
    onComplete();
  }
}
