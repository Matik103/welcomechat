
declare module "*.tsx" {
  import React from 'react';
  const Component: React.ComponentType<any>;
  export default Component;
}

// Allow importing .tsx files in .ts files
declare module "*.tsx" {
  import React from 'react';
  export const Component: React.ComponentType<any>;
  export * from "*.tsx";
}

// For specific component imports
declare module "@/components/client/resource-sections/DocumentResourcesSection" {
  import React from 'react';
  export const DocumentResourcesSection: React.ComponentType<any>;
}

declare module "@/components/client/resource-sections/WebsiteResourcesSection" {
  import React from 'react';
  export const WebsiteResourcesSection: React.ComponentType<any>;
}

declare module "@/contexts/AuthContext" {
  import React from 'react';
  export const AuthContext: React.Context<any>;
  export const AuthProvider: React.ComponentType<any>;
  export const useAuth: () => any;
  export type UserRole = 'admin' | 'client' | 'user' | null;
}

// Add import.meta support
interface ImportMeta {
  env: Record<string, string | undefined>;
  url: string;
}

// For Resend email API
declare module "resend" {
  export class Resend {
    constructor(apiKey: string);
    emails: {
      send: (options: any) => Promise<CreateEmailResponse>;
    };
  }
  
  export interface CreateEmailResponse {
    id?: string;
    error?: any;
    data?: {
      id: string;
    };
  }
}
