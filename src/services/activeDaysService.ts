
import { callRpcFunction } from '@/utils/rpcUtils';

/**
 * Get the number of active days for a client
 * @param client_id The client ID
 * @returns The number of active days
 */
export const getActiveDays = async (client_id: string): Promise<number> => {
  try {
    const result = await callRpcFunction<number>('get_active_days_count', { client_id_param: client_id });
    return result !== null && result !== undefined ? result : 0; // Return result or default to 0
  } catch (error) {
    console.error("Error getting active days:", error);
    return 0;
  }
};
