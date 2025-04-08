/**
 * User role types for the application
 */
export type UserRole = 'admin' | 'client';

/**
 * Auth context interface
 */
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
  userRole: UserRole | null;
  clientId: string | null;
  userId: string | null;
  userClientId: string | null;
  refreshUserRole: () => Promise<void>;
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
