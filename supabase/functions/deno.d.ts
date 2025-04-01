declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }

  export const env: Env;
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export interface SupabaseClient {
    rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
  }

  export function createClient(url: string, key: string): SupabaseClient;
}

declare module "https://esm.sh/resend@1.0.0" {
  export interface ResendClient {
    emails: {
      send: (params: {
        from: string;
        to: string | string[];
        subject: string;
        html: string;
      }) => Promise<{ data: unknown; error: Error | null }>;
    };
  }

  export class Resend {
    constructor(apiKey: string);
    emails: ResendClient["emails"];
  }
} 