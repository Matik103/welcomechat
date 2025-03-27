
/**
 * Completely empty client activity service
 */
export const createClientActivity = async (): Promise<any> => {
  return { success: true };
};

/**
 * Gets recent client activities for all clients
 */
export const getRecentActivities = async (): Promise<any[]> => {
  return [];
};

/**
 * Gets activities for a specific client
 */
export const getClientActivities = async (): Promise<any[]> => {
  return [];
};

/**
 * Counts activities by type for a specific client
 */
export const countActivitiesByType = async (): Promise<Record<string, number>> => {
  return {};
};
