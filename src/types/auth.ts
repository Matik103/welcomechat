
/**
 * User role types for the application
 */
export type UserRole = 'admin' | 'client';

/**
 * Auth context interface
 */
export interface AuthContextType {
  session: any | null;
  user: any | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
  userRole: UserRole | null;
}
