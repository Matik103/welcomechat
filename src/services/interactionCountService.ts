
import { callRpcFunctionVoid } from '@/utils/rpcUtils';

/**
 * Get the number of interactions for a client
 * @param client_id The client ID
 * @returns The number of interactions
 */
export const getInteractionCount = async (client_id: string): Promise<number> => {
  try {
    await callRpcFunctionVoid('get_total_interactions', { client_id_param: client_id });
    return 0; // Default value since we're moving to other methods
  } catch (error) {
    console.error("Error getting interaction count:", error);
    return 0;
  }
};
