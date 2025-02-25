
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InvitationData {
  role_type: 'admin' | 'client';
}

interface ClientRouteProps {
  children: React.ReactNode;
}

export const ClientRoute = ({ children }: ClientRouteProps) => {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  const { data: invitation, isLoading: isLoadingRole } = useQuery({
    queryKey: ["userRole", session?.user.email],
    queryFn: async () => {
      if (!session?.user.email) return null;
      const { data } = await supabase
        .from("client_invitations")
        .select("role_type")
        .eq("email", session.user.email)
        .eq("status", "accepted")
        .maybeSingle();
      
      return (data as InvitationData | null);
    },
    enabled: !!session?.user.email,
    staleTime: 30000, // Cache for 30 seconds to prevent rapid refetching
    retry: false // Don't retry on failure
  });

  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    // Use state to preserve the return URL
    const returnTo = location.pathname + location.search;
    return <Navigate to="/client-auth" state={{ returnTo }} replace />;
  }

  // If no invitation exists, redirect to auth
  if (!invitation) {
    return <Navigate to="/auth" replace />;
  }

  // If user is an admin, redirect them to admin dashboard
  if (invitation.role_type === "admin") {
    return <Navigate to="/" replace />;
  }

  // For clients, continue to client routes
  return <>{children}</>;
};
