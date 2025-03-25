
import { supabase } from "@/integrations/supabase/client";
import { execSql } from "@/utils/rpcUtils";
import { QueryItem } from "@/types/client-dashboard";

export interface TopQuery {
  query_text: string;
  frequency: number;
}

/**
 * Fetch top queries for a client from the common_queries table
 */
export const fetchTopQueries = async (clientId: string, agentName?: string, limit = 5): Promise<QueryItem[]> => {
  try {
    // Use execSql without type arguments
    const result = await execSql(
      `
      SELECT query_text, COUNT(*) as frequency
      FROM ai_agents
      WHERE client_id = $1
      AND interaction_type = 'chat_interaction'
      ${agentName ? `AND name = $2` : ''}
      AND query_text IS NOT NULL
      GROUP BY query_text
      ORDER BY frequency DESC
      LIMIT $3
      `,
      agentName ? [clientId, agentName, limit] : [clientId, limit]
    );
    
    if (!result || !Array.isArray(result)) {
      return [];
    }

    // Map to QueryItem format
    return result.map((item, index) => ({
      id: `query-${index}`,
      query_text: item.query_text,
      frequency: parseInt(item.frequency),
      client_id: clientId
    }));
  } catch (error) {
    console.error("Error fetching top queries:", error);
    return [];
  }
};

/**
 * Get recent common queries with pagination
 */
export const getCommonQueries = async (clientId: string, page = 1, pageSize = 10): Promise<QueryItem[]> => {
  try {
    // Use execSql without type arguments
    const result = await execSql(
      `
      SELECT query_text, COUNT(*) as frequency
      FROM ai_agents
      WHERE client_id = $1
      AND interaction_type = 'chat_interaction'
      AND query_text IS NOT NULL
      GROUP BY query_text
      ORDER BY frequency DESC
      LIMIT $2 OFFSET $3
      `,
      [clientId, pageSize, (page - 1) * pageSize]
    );
    
    if (!result || !Array.isArray(result)) {
      return [];
    }

    // Map to QueryItem interface
    return result.map((item, index) => ({
      id: `query-${index}`,
      query_text: item.query_text,
      frequency: parseInt(item.frequency),
      client_id: clientId
    }));
  } catch (error) {
    console.error("Error fetching common queries:", error);
    return [];
  }
};

/**
 * Archive a common query (mark it as reviewed or hide it)
 */
export const archiveCommonQuery = async (queryId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('common_queries')
      .update({ archived: true })
      .eq('id', queryId);
      
    return !error;
  } catch (error) {
    console.error("Error archiving query:", error);
    return false;
  }
};
