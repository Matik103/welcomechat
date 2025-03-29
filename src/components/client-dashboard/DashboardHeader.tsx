
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";

interface DashboardHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isRefreshing,
  onRefresh
}) => {
  return (
    <div className="flex justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        className="flex items-center gap-1 text-gray-600"
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Refreshing...</span>
          </>
        ) : (
          <>
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh</span>
          </>
        )}
      </Button>
    </div>
  );
};
