
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClientRouteProps {
  children: React.ReactNode;
}

export const ClientRoute = ({ children }: ClientRouteProps) => {
  const { session, isLoading } = useAuth();

  const { data: userRole, isLoading: isLoadingRole } = useQuery({
    queryKey: ["userRole", session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return null;
      const { data, error } = await supabase
        .from("client_invitations")
        .select("role_type")
        .eq("email", session.user.email)
        .single();
      if (error) throw error;
      return data?.role_type;
    },
    enabled: !!session?.user.id,
  });

  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/client-auth" replace />;
  }

  // If user is an admin, redirect them to admin dashboard
  if (userRole === "admin") {
    return <Navigate to="/" replace />;
  }

  // For clients, continue to client routes
  if (userRole === "client") {
    return <>{children}</>;
  }

  // If no valid role is found, redirect to auth
  return <Navigate to="/auth" replace />;
};
