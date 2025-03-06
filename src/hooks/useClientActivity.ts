
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { mapActivityType } from "@/utils/activityTypeUtils";
import { createClientActivity, ensureUserRole } from "@/services/clientActivityService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useClientActivity = (clientId: string | undefined) => {
  /**
   * Validates a URL to ensure it's accessible
   */
  const validateUrl = async (url: string): Promise<boolean> => {
    try {
      // Make a HEAD request to check if the URL is accessible
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error("Error validating URL:", error);
      return false;
    }
  };

  /**
   * Checks if a Google Drive link is publicly accessible
   */
  const validateGoogleDriveLink = async (url: string): Promise<boolean> => {
    try {
      // Extract file ID from Google Drive URL
      const fileId = url.match(/[-\w]{25,}/);
      if (!fileId) {
        toast.error("Invalid Google Drive URL format");
        return false;
      }

      // Try to access the file metadata
      const response = await fetch(`https://drive.google.com/uc?id=${fileId[0]}`);
      return response.ok;
    } catch (error) {
      console.error("Error validating Google Drive link:", error);
      return false;
    }
  };

  /**
   * Checks if a URL contains embedded Google Drive links
   */
  const checkForEmbeddedDriveLinks = async (url: string): Promise<string[]> => {
    try {
      // Fetch the page content
      const response = await fetch(url);
      const text = await response.text();
      
      // Extract Google Drive links using regex
      const driveLinks = text.match(/https:\/\/drive\.google\.com\/[^\s<>"']+/g) || [];
      return driveLinks;
    } catch (error) {
      console.error("Error checking for embedded Drive links:", error);
      return [];
    }
  };

  /**
   * Logs client activity with enhanced error handling
   */
  const logClientActivity = async (
    activity_type: ExtendedActivityType, 
    description: string, 
    metadata: Json = {}
  ): Promise<void> => {
    if (!clientId) {
      console.warn("Cannot log activity: No client ID provided");
      return;
    }
    
    try {
      // Map the activity type and enhance metadata if needed
      const { dbActivityType, enhancedMetadata } = mapActivityType(activity_type, metadata);
      
      // Create the activity record
      await createClientActivity(clientId, dbActivityType, description, enhancedMetadata);
    } catch (error) {
      // Enhanced error logging
      console.error("Failed to log client activity:", {
        error,
        clientId,
        activity_type,
        description
      });
      
      // We don't rethrow the error to prevent UI disruption,
      // but this could be modified based on requirements
    }
  };

  /**
   * Ensures a user role exists for the given user
   */
  const ensureClientRole = async (userId: string): Promise<void> => {
    if (!clientId) {
      console.warn("Cannot ensure client role: No client ID provided");
      return;
    }
    
    try {
      await ensureUserRole(userId, "client", clientId);
    } catch (error) {
      console.error("Failed to ensure client role:", error);
      // Don't rethrow to prevent UI disruption
    }
  };

  return {
    logClientActivity,
    ensureClientRole,
    validateUrl,
    validateGoogleDriveLink,
    checkForEmbeddedDriveLinks
  };
};
