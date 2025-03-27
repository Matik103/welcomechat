
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Completely disabled OpenAI assistant setup
 * Logs to console but doesn't actually create anything
 */
export const setupOpenAIAssistant = async (clientId: string, agentName: string, agentDescription: string, clientName: string) => {
  console.log('OpenAI assistant setup completely disabled');
  console.log('Setup request ignored for:', { clientId, agentName, agentDescription, clientName });
  return { 
    success: true, 
    message: 'OpenAI assistant setup completely disabled'
  };
};

/**
 * Completely disabled OpenAI assistant creation
 * Logs to console but doesn't actually create anything
 */
export const createOpenAIAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string,
  clientName?: string
): Promise<string> => {
  console.log('OpenAI assistant creation completely disabled');
  console.log('Creation request ignored for:', { clientId, agentName, agentDescription, clientName });
  
  // Return a mock assistant ID
  return `mock-assistant-id-${Date.now()}`;
};
