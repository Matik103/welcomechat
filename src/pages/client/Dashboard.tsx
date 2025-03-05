
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { InteractionStats } from "@/components/client-dashboard/InteractionStats";
import { ErrorLogList } from "@/components/client-dashboard/ErrorLogList";
import { QueryList } from "@/components/client-dashboard/QueryList";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { Loader2, LogOut, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErrorLog, QueryItem } from "@/hooks/useClientDashboard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface ClientDashboardProps {
  clientId?: string;
}

const ClientDashboard = ({ clientId }: ClientDashboardProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Get client ID from user metadata if not provided
  const effectiveClientId = clientId || user?.user_metadata?.client_id;
  
  const {
    stats,
    errorLogs,
    queries,
    isLoadingErrorLogs,
    isLoadingQueries,
  } = useClientDashboard(effectiveClientId);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth", { replace: true });
      toast.success("Successfully signed out");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#F8F9FA] min-h-screen relative">
      {/* Stats section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <InteractionStats stats={stats} />
      </div>

      {/* Recent data section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error logs card */}
        <ErrorLogList 
          logs={errorLogs as ErrorLog[]} 
          isLoading={isLoadingErrorLogs} 
        />

        {/* Common queries card */}
        <QueryList 
          queries={queries as QueryItem[]} 
          isLoading={isLoadingQueries} 
        />
      </div>
      
      {/* Account actions bottom left */}
      <div className="fixed bottom-8 left-8 flex flex-col gap-2 z-40">
        <Button variant="outline" asChild className="gap-2 justify-start">
          <Link to="/client/settings">
            <KeyRound className="h-4 w-4" />
            Change Password
          </Link>
        </Button>
        <Button variant="outline" className="gap-2 justify-start text-red-600 hover:bg-red-50" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
};

export default ClientDashboard;
