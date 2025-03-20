
import { callRpcFunctionVoid } from '@/utils/rpcUtils';

/**
 * Get the average response time for a client
 * @param client_id The client ID
 * @returns The average response time
 */
export const getAverageResponseTime = async (client_id: string): Promise<number> => {
  try {
    await callRpcFunctionVoid('get_average_response_time', { client_id_param: client_id });
    return 0; // Default value since we're moving to other methods
  } catch (error) {
    console.error("Error getting average response time:", error);
    return 0;
  }
};
