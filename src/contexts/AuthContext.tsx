
import { createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { useAuthState } from "@/hooks/useAuthState";
import { AuthContextType } from "@/types/auth";
import { toast } from "sonner";
import { determineUserRole } from "@/utils/authUtils";
import { useAuthStateChange } from "@/hooks/useAuthStateChange";
import { useAuthCallback } from "@/hooks/useAuthCallback";
import { useAuthInitialize } from "@/hooks/useAuthInitialize";
import { useAuthSafetyTimeout } from "@/hooks/useAuthSafetyTimeout";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { 
    session, setSession,
    user, setUser,
    userRole, setUserRole,
    isLoading, setIsLoading,
    authInitialized, setAuthInitialized
  } = useAuthState();
  
  const location = useLocation();
  const isCallbackUrl = location.pathname.includes('/auth/callback');
  const isAuthPage = location.pathname === '/auth';

  // Safety timeout to prevent infinite loading
  useAuthSafetyTimeout({
    isLoading,
    setIsLoading,
    isAuthPage,
    session
  });

  // Handle Google SSO callback
  useAuthCallback({
    isCallbackUrl,
    setSession,
    setUser,
    setUserRole,
    setIsLoading,
    determineUserRole
  });

  // Initialize authentication state
  useAuthInitialize({
    authInitialized,
    isCallbackUrl,
    setSession,
    setUser,
    setUserRole,
    setIsLoading,
    setAuthInitialized,
    determineUserRole
  });

  // Handle authentication state changes
  useAuthStateChange({
    setSession,
    setUser,
    setUserRole,
    setIsLoading,
    determineUserRole
  });

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSession(null);
      setUser(null);
      setUserRole(null);
      
      // Use navigate instead of window.location for better UX
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Sign out error. Please try again.');
      setSession(null);
      setUser(null);
      setUserRole(null);
      window.location.href = '/auth';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      signOut, 
      isLoading: isCallbackUrl ? true : isLoading, // Only force loading if on callback URL
      userRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
