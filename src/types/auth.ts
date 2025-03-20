
import { UserRole } from "./app";

// Re-export the UserRole from app types for backward compatibility
export { UserRole };

/**
 * Type for authentication state
 */
export interface AuthState {
  isLoading: boolean;
  session: any | null;
  user: any | null;
  userRole: UserRole | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  confirmPassword: string;
}

export interface ResetPasswordCredentials {
  password: string;
  confirmPassword: string;
}
