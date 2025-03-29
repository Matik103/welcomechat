
import { useState, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";

export function useAuthState() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Use useCallback to memoize the setter functions
  const setSessionCallback = useCallback((newSession: Session | null) => {
    setSession(newSession);
  }, []);

  const setUserCallback = useCallback((newUser: User | null) => {
    setUser(newUser);
  }, []);

  const setUserRoleCallback = useCallback((newRole: UserRole | null) => {
    setUserRole(newRole);
  }, []);

  const setIsLoadingCallback = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setAuthInitializedCallback = useCallback((initialized: boolean) => {
    setAuthInitialized(initialized);
  }, []);

  return {
    session,
    setSession: setSessionCallback,
    user,
    setUser: setUserCallback,
    userRole,
    setUserRole: setUserRoleCallback,
    isLoading,
    setIsLoading: setIsLoadingCallback,
    authInitialized,
    setAuthInitialized: setAuthInitializedCallback
  };
}
