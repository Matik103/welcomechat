
import { useClientStats } from "./useClientStats";
import { useClientErrorLogs } from "./useClientErrorLogs";
import { useClientQueries } from "./useClientQueries";

// Re-export the types from the individual hooks
export type { InteractionStats } from "./useClientStats";
export type { ErrorLog } from "./useClientErrorLogs";
export type { QueryItem } from "./useClientQueries";

export const useClientDashboard = (clientId: string | undefined) => {
  const { stats, isLoading: isLoadingStats } = useClientStats(clientId);
  const { errorLogs, isLoading: isLoadingErrorLogs } = useClientErrorLogs(clientId);
  const { queries, isLoading: isLoadingQueries } = useClientQueries(clientId);

  return {
    stats,
    errorLogs,
    queries,
    isLoadingErrorLogs,
    isLoadingQueries,
    isLoadingStats,
  };
};
