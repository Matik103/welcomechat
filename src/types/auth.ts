
/**
 * User role types for the application
 */
export type UserRole = 'admin' | 'client' | null;

/**
 * Auth context interface
 */
export interface AuthContextType {
  session: any | null;
  user: any | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  signIn?: (email: string, password: string) => Promise<any>;
  signUp?: (email: string, password: string) => Promise<any>;
  resetPassword?: (email: string) => Promise<any>;
  updatePassword?: (password: string) => Promise<any>;
  userId?: string | null;
  clientId?: string | null;
  userRole: UserRole;
  refreshUserRole?: () => Promise<void>;
  userClientId?: string | null;
  isAuthenticated?: boolean;
}

/**
 * Page heading props
 */
export interface PageHeadingProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * Client form props
 */
export interface ClientFormProps {
  onSubmit: (data: any) => Promise<void>;
  initialValues?: any;
  isEditMode?: boolean;
  children?: React.ReactNode;
}

/**
 * Client search bar props
 */
export interface ClientSearchBarProps {
  onSearch?: (query: string) => void;
  className?: string;
}
