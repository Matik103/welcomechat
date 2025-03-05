
import { NavigateFunction } from "react-router-dom";
import { UserRole } from "@/types/auth";

export const handleAuthRedirect = (
  role: UserRole | null,
  event: string,
  location: { pathname: string },
  navigate: NavigateFunction
) => {
  // Only handle redirects for SIGNED_IN or TOKEN_REFRESHED events
  if (event !== 'SIGNED_IN' && event !== 'TOKEN_REFRESHED') return;
  
  if (role === 'client') {
    if (location.pathname === '/' || location.pathname.startsWith('/admin/')) {
      console.log("Redirecting client user to client dashboard");
      navigate('/client/view', { replace: true });
    }
  } else if (role === 'admin') {
    if (location.pathname.startsWith('/client/') && !location.pathname.startsWith('/client/setup')) {
      navigate('/', { replace: true });
    }
  }
};
