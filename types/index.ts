export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  authInitialized: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<{ user: any | null; error: any | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ user: any | null; error: any | null }>;
  signOut: () => Promise<{ error: any | null }>;
  forgotPassword: (email: string) => Promise<{ error: any | null }>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error: any | null }>;
}