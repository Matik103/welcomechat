
/**
 * Core application types for the application after client management removal
 */

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'admin' | 'user';

export interface AppConfig {
  name: string;
  description: string;
  version: string;
  environment: 'development' | 'production' | 'test';
}

export interface AppState {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}
