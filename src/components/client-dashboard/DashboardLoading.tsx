
import React from "react";
import { Loader2 } from "lucide-react";

interface DashboardLoadingProps {
  message?: string;
}

export const DashboardLoading: React.FC<DashboardLoadingProps> = ({
  message = "Loading your dashboard..."
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
};
