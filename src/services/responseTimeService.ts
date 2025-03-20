
import { callRpcFunction } from '@/utils/rpcUtils';

/**
 * Get the average response time for a client
 * @param client_id The client ID
 * @returns The average response time
 */
export const getAverageResponseTime = async (client_id: string): Promise<number> => {
  try {
    const result = await callRpcFunction<number>('get_average_response_time', { client_id_param: client_id });
    return result !== null && result !== undefined ? result : 0; // Return result or default to 0
  } catch (error) {
    console.error("Error getting average response time:", error);
    return 0;
  }
};
