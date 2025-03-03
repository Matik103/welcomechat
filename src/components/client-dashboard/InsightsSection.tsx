
import React from "react";
import { QueryList } from "@/components/client-dashboard/QueryList";
import { ErrorLogList } from "@/components/client-dashboard/ErrorLogList";

interface InsightsSectionProps {
  queries: any[] | undefined;
  isLoadingQueries: boolean;
  errorLogs: any[] | undefined;
  isLoadingErrors: boolean;
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({
  queries,
  isLoadingQueries,
  errorLogs,
  isLoadingErrors
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <QueryList 
        queries={queries} 
        isLoading={isLoadingQueries} 
      />
      
      <ErrorLogList 
        logs={errorLogs} 
        isLoading={isLoadingErrors} 
      />
    </div>
  );
};
