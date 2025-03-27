
/**
 * Creates a new client activity record - Currently just logs to console
 * 
 * @param clientId The client ID
 * @param description A description of the activity
 * @param metadata Additional metadata (optional)
 * @returns The created activity record
 */
export const createClientActivity = async (
  clientId: string,
  description: string,
  metadata: Record<string, any> = {}
): Promise<any> => {
  try {
    // Log to console instead of database
    console.log(`[ACTIVITY LOG]: ${description}`, {
      clientId,
      metadata,
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error in createClientActivity:', error);
    throw error;
  }
};

/**
 * Gets recent client activities for all clients - Currently returns empty array
 * 
 * @param limit Maximum number of activities to return
 * @returns A list of recent activities with client information
 */
export const getRecentActivities = async (limit = 20): Promise<any[]> => {
  console.log('Activity logging is disabled - client_activities table has been removed');
  return [];
};

/**
 * Gets activities for a specific client - Currently returns empty array
 * 
 * @param clientId The client ID
 * @param limit Maximum number of activities to return
 * @returns A list of client activities
 */
export const getClientActivities = async (clientId: string, limit = 50): Promise<any[]> => {
  console.log('Activity logging is disabled - client_activities table has been removed');
  return [];
};

/**
 * Counts activities by type for a specific client - Currently returns empty object
 * 
 * @param clientId The client ID
 * @returns A record of activity counts by type
 */
export const countActivitiesByType = async (clientId: string): Promise<Record<string, number>> => {
  console.log('Activity logging is disabled - client_activities table has been removed');
  return {};
};
