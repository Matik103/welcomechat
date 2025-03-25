
import { execSql } from "@/utils/rpcUtils";

export interface DailyInteractions {
  day: string;
  count: number;
}

export const getInteractionsByDay = async (clientId: string, days: number = 30): Promise<DailyInteractions[]> => {
  try {
    // Use execSql without type arguments
    const result = await execSql(
      `
      SELECT 
        date_trunc('day', created_at) AS day,
        COUNT(*) AS count
      FROM client_activities
      WHERE 
        activity_type = 'chat_interaction'
        AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND client_id = $1
      GROUP BY date_trunc('day', created_at)
      ORDER BY day
      `,
      [clientId]
    );
    
    if (!result || !Array.isArray(result)) {
      console.error("Unexpected result from execSql:", result);
      return [];
    }

    // Map the data to the DailyInteractions interface
    const dailyInteractions: DailyInteractions[] = result.map((row: any) => ({
      day: row.day,
      count: row.count,
    }));

    return dailyInteractions;
  } catch (error) {
    console.error("Error fetching interactions by day:", error);
    return [];
  }
};

// Alias function to support old references
export const getInteractionCount = async (clientId: string): Promise<number> => {
  try {
    const interactions = await getInteractionsByDay(clientId);
    return interactions.reduce((sum, item) => sum + item.count, 0);
  } catch (error) {
    console.error("Error getting interaction count:", error);
    return 0;
  }
};
