
import { toast } from "sonner";

/**
 * Safe utilities for OpenAI integration that completely disable automatic creation
 * and don't trigger activity logging with invalid enum values
 */
export const safeOpenAIUtils = {
  /**
   * Completely disabled OpenAI assistant creation function
   * This is a dummy function that only logs to console and returns a success response
   * without making any API calls or triggering any database activity
   */
  createAssistant: async (clientId: string, agentName: string, description: string) => {
    // Log the attempt but don't actually create anything
    console.log('OpenAI assistant creation is completely disabled');
    console.log('Assistant creation request ignored for:', { clientId, agentName, description });
    
    // Return a mock success without actually creating anything
    return { 
      success: true, 
      message: 'OpenAI assistant creation completely disabled'
    };
  }
};
