
// Type declarations for Deno APIs used in Supabase Edge Functions
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): Record<string, string>;
  }
  
  export const env: Env;
}

// Declare modules used in Supabase Edge Functions
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://deno.land/std@0.177.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string): any;
}

declare module "npm:resend@1.0.0" {
  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(options: {
        from: string;
        to: string | string[];
        subject: string;
        html?: string;
        text?: string;
      }): Promise<any>;
    };
  }
}

// Declare the modules with .ts extensions
declare module "../_shared/cors.ts" {
  export const corsHeaders: Record<string, string>;
}

// Add explicit module declarations for FirecrawlResponse and LlamaParseResponse types
interface CommonResponse {
  error?: string;
  status?: "success" | "error";
  jobId?: string;
}

interface FirecrawlResponse<T> extends CommonResponse {
  success: boolean;
  data?: T;
}

interface LlamaParseResponse extends CommonResponse {
  content?: string;
  metadata?: Record<string, any>;
  documentId?: string;
}

declare module "../_shared/LlamaParseService.ts" {
  export { LlamaParseResponse };
  
  export interface LlamaParseServiceConfig {
    apiKey: string;
    baseUrl?: string;
  }
  
  export interface ProcessDocumentOptions {
    url: string;
    metadata?: Record<string, any>;
    callbackUrl?: string;
  }
  
  export class LlamaParseService {
    constructor(config: LlamaParseServiceConfig);
    processDocument(options: ProcessDocumentOptions): Promise<LlamaParseResponse>;
    checkJobStatus(jobId: string): Promise<LlamaParseResponse>;
  }
}

declare module "../_shared/FirecrawlService.ts" {
  export { FirecrawlResponse };
  
  export interface FirecrawlServiceConfig {
    apiKey: string;
    baseUrl?: string;
  }
  
  export class FirecrawlService {
    constructor(config: FirecrawlServiceConfig);
    processUrl(url: string, options?: any): Promise<FirecrawlResponse<{ jobId: string }>>;
    checkJobStatus(jobId: string): Promise<FirecrawlResponse<any>>;
    crawlWebsite(options: { url: string, maxPages?: number, maxDepth?: number }): Promise<FirecrawlResponse<{ jobId: string }>>;
  }
}
