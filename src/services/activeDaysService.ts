import { execSql } from "@/utils/rpcUtils";

export interface ActiveDay {
  day: string;
  active_clients: number;
}

export const getActiveDays = async (clientId: string, days: number = 30): Promise<ActiveDay[]> => {
  try {
    const result = await execSql(
      `
      SELECT 
        date_trunc('day', created_at) AS day,
        COUNT(DISTINCT client_id) AS active_clients
      FROM client_activities
      WHERE 
        created_at >= CURRENT_DATE - INTERVAL '${days} days'
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

    const activeDays: ActiveDay[] = result.map((row: any) => ({
      day: row.day,
      active_clients: row.active_clients,
    }));

    return activeDays;
  } catch (error) {
    console.error("Error fetching active days:", error);
    return [];
  }
};
