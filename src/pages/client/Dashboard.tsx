import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { InteractionStats } from "@/components/client-dashboard/InteractionStats";
import { ErrorLogList } from "@/components/client-dashboard/ErrorLogList";
import { QueryList } from "@/components/client-dashboard/QueryList";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { Loader2, RefreshCcw, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErrorLog, QueryItem } from "@/types/client-dashboard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { checkAndRefreshAuth } from "@/services/authService";

export interface ClientDashboardProps {
  clientId?: string;
}

const ClientDashboard = ({ clientId }: ClientDashboardProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loadTimeout, setLoadTimeout] = useState<boolean>(false);
  const [isAuthVerified, setIsAuthVerified] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  
  // Set a timeout to ensure we don't get stuck in a loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadTimeout(true);
    }, 5000); // Extended timeout to 5 seconds
    
    return () => clearTimeout(timeout);
  }, []);
  
  // Verify authentication early using the auth service
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        console.log("Dashboard: Verifying authentication");
        setIsAuthChecking(true);
        
        // First check if we have user data from context
        if (user) {
          console.log("Dashboard: User found in context:", user.id);
          setIsAuthVerified(true);
          setIsAuthChecking(false);
          return;
        }
        
        // Otherwise verify with Supabase
        const isValid = await checkAndRefreshAuth();
        console.log("Dashboard: Auth check result:", isValid);
        
        if (!isValid) {
          console.log("Dashboard: Authentication failed, redirecting to auth");
          toast.error("Please sign in to view your dashboard");
          setTimeout(() => navigate("/auth"), 500);
        } else {
          setIsAuthVerified(true);
        }
      } catch (error) {
        console.error("Dashboard: Auth verification error:", error);
        toast.error("Authentication error. Please try signing in again.");
        setTimeout(() => navigate("/auth"), 500);
      } finally {
        setIsAuthChecking(false);
      }
    };
    
    verifyAuth();
  }, [user, navigate]);

  // Get client ID from user metadata if not provided
  const effectiveClientId = clientId || user?.user_metadata?.client_id;
  
  const {
    stats,
    errorLogs,
    queries,
    isLoadingErrorLogs,
    isLoadingQueries,
    isLoadingStats,
    authError
  } = useClientDashboard(effectiveClientId);

  // Handle auth error
  useEffect(() => {
    if (authError) {
      toast.error("Your session has expired. Please sign in again.");
      // Give the toast time to display before signing out
      const timer = setTimeout(() => {
        signOut?.();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [authError, signOut]);

  // Show initial loading state while checking auth
  if (isAuthChecking && !loadTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Verifying your account...</p>
        </div>
      </div>
    );
  }

  // Show fallback UI if authentication failed after timeout
  if (!isAuthVerified && loadTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center text-center max-w-md p-6">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">
            We couldn't verify your access to this dashboard. This could be due to an expired session or network issues.
          </p>
          <Button 
            variant="default" 
            onClick={() => navigate("/auth")}
            className="mb-2 w-full"
          >
            Sign In
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state for data
  if ((isLoadingStats || isLoadingErrorLogs || isLoadingQueries) && !loadTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show warning if client ID is missing
  if (!effectiveClientId && isAuthVerified) {
    return (
      <div className="bg-[#F8F9FA] min-h-screen p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Client ID Missing</h2>
          <p className="text-gray-600 mb-4">
            Your account doesn't have a client ID assigned. Please contact support or the administrator.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-1 text-gray-600 mx-auto"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Refresh button */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-1 text-gray-600"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
        
        {/* Client information */}
        {user && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-medium">Welcome, {user.email}</h2>
            <p className="text-sm text-gray-500">Client ID: {effectiveClientId || "Not assigned"}</p>
          </div>
        )}
        
        {/* Stats section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <InteractionStats 
            stats={stats} 
            isLoading={isLoadingStats && !loadTimeout} 
          />
        </div>

        {/* Recent data section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Error logs card */}
          <ErrorLogList 
            logs={errorLogs as ErrorLog[]} 
            isLoading={isLoadingErrorLogs && !loadTimeout} 
          />

          {/* Common queries card */}
          <QueryList 
            queries={queries as QueryItem[]} 
            isLoading={isLoadingQueries && !loadTimeout} 
          />
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
