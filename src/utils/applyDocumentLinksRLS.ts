
import { supabase } from "@/integrations/supabase/client";

/**
 * Fixes RLS (Row Level Security) issues with document_links table
 * Should only be used in development or as admin
 */
export const fixDocumentLinksRLS = async () => {
  try {
    console.log("Attempting to fix document_links RLS...");
    
    // Call the Supabase function that applies RLS fixes
    const { data, error } = await supabase.functions.invoke('fix-document-rls', {
      body: {}
    });
    
    if (error) {
      console.error("Error fixing document links RLS:", error);
      return {
        success: false,
        message: error.message || "Unexpected error fixing permissions"
      };
    }
    
    console.log("Document links RLS fix result:", data);
    
    return {
      success: true,
      message: "Security permissions fixed successfully"
    };
  } catch (error) {
    console.error("Exception while fixing document links RLS:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error fixing permissions"
    };
  }
};
