
interface WindowWithEnv extends Window {
  __ENV?: {
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
    VITE_SUPABASE_SERVICE_ROLE_KEY?: string;
    [key: string]: string | undefined;
  };
}

declare const window: WindowWithEnv;
