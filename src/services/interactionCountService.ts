
import { callRpcFunction } from '@/utils/rpcUtils';

/**
 * Get the number of interactions for a client
 * @param client_id The client ID
 * @returns The number of interactions
 */
export const getInteractionCount = async (client_id: string): Promise<number> => {
  try {
    const result = await callRpcFunction<number>('get_total_interactions', { client_id_param: client_id });
    return result !== null && result !== undefined ? result : 0; // Return result or default to 0
  } catch (error) {
    console.error("Error getting interaction count:", error);
    return 0;
  }
};
