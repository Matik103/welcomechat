
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { userRole, isLoading } = useAuth();
  
  useEffect(() => {
    console.log('Index component mounted, userRole:', userRole);
    
    if (!isLoading) {
      if (userRole === 'admin') {
        console.log('Redirecting admin to admin dashboard');
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'client') {
        console.log('Redirecting client to client dashboard');
        navigate('/client/dashboard', { replace: true });
      } else {
        // If role not determined yet but we're authenticated, wait for role
        console.log('Role not determined yet, waiting...');
      }
    }
  }, [userRole, isLoading, navigate]);
  
  // Show loading spinner while determining where to redirect
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          Loading the right dashboard for you...
        </p>
      </div>
    </div>
  );
}
