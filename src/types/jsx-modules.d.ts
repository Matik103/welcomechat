
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

// Allow importing .d.ts files
declare module "*.d.ts" {
  const content: any;
  export default content;
}

// Add import.meta support
interface ImportMeta {
  env: Record<string, string | undefined>;
  url: string;
}
