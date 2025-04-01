
/// <reference types="vite/client" />

// Global environment variables that will be injected at runtime
interface Window {
  ENV?: Record<string, string>;
}
