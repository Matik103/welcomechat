
/**
 * Safely access environment variables in a way that's compatible with both
 * client-side and server-side rendering
 */
export function getEnvVariable(name: string): string | undefined {
  try {
    // For server-side usage (Node.js)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name];
    }
    
    // For client-side usage
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[name] as string;
    }
    
    return undefined;
  } catch (e) {
    console.warn(`Error accessing environment variable ${name}:`, e);
    return undefined;
  }
}

/**
 * Returns the base URL for API requests
 */
export function getApiBaseUrl(): string {
  return getEnvVariable('VITE_API_BASE_URL') || '';
}
