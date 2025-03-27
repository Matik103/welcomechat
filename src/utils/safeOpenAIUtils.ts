
import { toast } from "sonner";

/**
 * Safe utilities for OpenAI integration that avoid automatic creation
 * and don't trigger activity logging with invalid enum values
 */
export const safeOpenAIUtils = {
  /**
   * Safely creates an OpenAI assistant only when explicitly called
   * Currently disabled to prevent enum issues
   */
  createAssistant: async (clientId: string, agentName: string, description: string) => {
    // This function is intentionally limited to prevent automatic OpenAI assistant creation
    // that might trigger problematic activity logging
    console.log('OpenAI assistant creation is currently disabled to prevent database issues');
    console.log('Would have created assistant for:', { clientId, agentName, description });
    
    // Return a mock success without actually creating anything
    return { 
      success: true, 
      message: 'OpenAI assistant creation skipped to prevent database issues'
    };
  }
};
