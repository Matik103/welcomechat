
// Default configuration values
export const DEFAULT_LOADING_TIMEOUT = 5; // seconds
export const DEFAULT_ERROR_TIMEOUT = 3; // seconds
export const DEFAULT_REFRESH_INTERVAL = 300000; // 5 minutes in milliseconds
export const DEFAULT_CACHE_TIME = 60000; // 1 minute in milliseconds
export const CACHE_STALE_TIME = 1000 * 60 * 5; // 5 minutes in milliseconds
export const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
export const EDGE_FUNCTIONS_URL = process.env.EDGE_FUNCTIONS_URL || '';
