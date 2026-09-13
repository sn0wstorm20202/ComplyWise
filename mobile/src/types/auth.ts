/**
 * ComplyWise Mobile - Authentication & Session Types
 *
 * Authority: TRD_v2.0 §31
 * Matches the actual Django REST API authentication contract.
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  date_joined: string;
}

export type AuthStatus =
  | 'INITIALIZING'
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'LOGGING_OUT'
  | 'ERROR';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthContextValue {
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}
