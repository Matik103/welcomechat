
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
  });

  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/client-auth" state={{ from: location }} replace />;
  }

  // If user is an admin, redirect them to admin dashboard
  if (invitation?.role_type === "admin") {
    return <Navigate to="/" replace />;
  }

  // For clients, continue to client routes
  if (invitation?.role_type === "client") {
    return <>{children}</>;
  }

  // If no valid role is found, redirect to auth
  return <Navigate to="/auth" replace />;
};
