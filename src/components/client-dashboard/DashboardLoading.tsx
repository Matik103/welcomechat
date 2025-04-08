
import React from "react";
import { Spinner } from "@/components/ui/spinner";

interface DashboardLoadingProps {
  message?: string;
}

export const DashboardLoading: React.FC<DashboardLoadingProps> = ({
  message = "Loading your dashboard..."
}) => {
  return (
    <div className="flex items-center justify-center py-12 min-h-[calc(100vh-200px)]">
      <div className="flex flex-col items-center">
        <Spinner size="lg" className="text-primary mb-4" />
        <p className="text-base text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};
