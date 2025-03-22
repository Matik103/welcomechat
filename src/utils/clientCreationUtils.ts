
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a temporary password for a new client
 */
export const generateTempPassword = (): string => {
  // Generate a password in the format "Welcome2025#123"
  const currentYear = new Date().getFullYear();
  const randomDigits = Math.floor(Math.random() * 900) + 100; // 100-999
  return `Welcome${currentYear}#${randomDigits}`;
};

/**
 * Upload a logo file to storage and get its public URL
 */
export const uploadLogo = async (logoFile: File, clientId: string): Promise<{ url: string, path: string } | null> => {
  if (!logoFile) return null;
  
  try {
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${clientId}_${uuidv4()}.${fileExt}`;
    const filePath = `${clientId}/logos/${fileName}`;
    
    // Upload the file to client_documents bucket
    const { error: uploadError } = await supabase.storage
      .from('client_documents')
      .upload(filePath, logoFile);
      
    if (uploadError) {
      console.error('Logo upload error:', uploadError);
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }
    
    // Get the public URL
    const { data } = supabase.storage
      .from('client_documents')
      .getPublicUrl(filePath);
      
    return {
      url: data.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Logo processing error:', error);
    return null;
  }
};

/**
 * Save temporary password for a client
 */
export const saveClientTempPassword = async (
  clientId: string, 
  email: string, 
  tempPassword: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("client_temp_passwords")
      .insert({
        agent_id: clientId,
        email: email,
        temp_password: tempPassword
      });
      
    if (error) {
      console.error("Error saving temporary password:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error saving client temp password:", error);
    return false;
  }
};

/**
 * Safely parse JSON string or return default value
 */
export const safeJsonParse = (jsonString: string | null | undefined, defaultValue: any = {}): any => {
  if (!jsonString) return defaultValue;
  
  try {
    if (typeof jsonString === 'object') return jsonString;
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return defaultValue;
  }
};

/**
 * Extract widget settings from client data safely
 */
export const extractWidgetSettings = (clientData: any): any => {
  if (!clientData) return {};
  
  // Check various possible locations for widget settings
  if (clientData.settings && typeof clientData.settings === 'object') {
    return clientData.settings;
  }
  
  if (clientData.widget_settings) {
    if (typeof clientData.widget_settings === 'object') {
      return clientData.widget_settings;
    }
    
    if (typeof clientData.widget_settings === 'string') {
      return safeJsonParse(clientData.widget_settings, {});
    }
  }
  
  // Create minimal settings from client data
  return {
    agent_name: clientData.agent_name || clientData.name || "AI Assistant",
    agent_description: clientData.agent_description || "",
    logo_url: clientData.logo_url || "",
    logo_storage_path: clientData.logo_storage_path || ""
  };
};
