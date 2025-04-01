
// Global type definitions

// Fix for JSX TS6142 errors
declare module '*.tsx' {
  import React from 'react';
  const Component: React.ComponentType<any>;
  export default Component;
}

// Fix for error handling
interface Error {
  message: string;
  name: string;
}

// Fix for Window.ENV
interface Window {
  ENV?: {
    VITE_FIRECRAWL_API_KEY?: string;
    VITE_FIRECRAWL_API_URL?: string;
  }
}
