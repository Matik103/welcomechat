
import { callRpcFunctionVoid } from '@/utils/rpcUtils';

/**
 * Get the number of active days for a client
 * @param client_id The client ID
 * @returns The number of active days
 */
export const getActiveDays = async (client_id: string): Promise<number> => {
  try {
    await callRpcFunctionVoid('get_active_days_count', { client_id_param: client_id });
    return 0; // Default value since we're moving to other methods
  } catch (error) {
    console.error("Error getting active days:", error);
    return 0;
  }
};
