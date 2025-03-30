
import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout"; 
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AdminDashboardFallbackProps {
  message?: string;
  error?: string | null;
  onRetry?: () => void;
}

export const AdminDashboardFallback: React.FC<AdminDashboardFallbackProps> = ({
  message = "Loading dashboard...",
  error = null,
  onRetry
}) => {
  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-8 max-w-md">
            {error ? (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                  <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
                  <p className="text-red-600 mb-4">{error}</p>
                  {onRetry && (
                    <Button 
                      onClick={onRetry}
                      variant="destructive"
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-base text-muted-foreground">{message}</p>
                <p className="text-sm text-muted-foreground mt-2">This may take a moment...</p>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
