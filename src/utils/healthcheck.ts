
// Health check utilities

/**
 * Check the overall health of the application
 */
export const checkHealth = async () => {
  const results = {
    supabase: await checkSupabaseConnection(),
    localStorage: checkLocalStorage(),
    sessionStorage: checkSessionStorage(),
    internetConnection: await checkInternetConnection(),
    permissions: checkPermissions(),
  };

  const isHealthy = Object.values(results).every(result => 
    typeof result === 'boolean' ? result : result.valid
  );

  return {
    isHealthy,
    results,
    timestamp: new Date().toISOString()
  };
};

/**
 * Check if Supabase connection is working
 */
export const checkSupabaseConnection = async () => {
  try {
    // This is just a placeholder - in a real implementation we'd
    // make a lightweight query to Supabase to check connectivity
    return true;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

/**
 * Check local storage availability
 */
export const checkLocalStorage = () => {
  try {
    const testKey = '__test_key__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Check session storage availability
 */
export const checkSessionStorage = () => {
  try {
    const testKey = '__test_key__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Check internet connection
 */
export const checkInternetConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://www.google.com', { 
      mode: 'no-cors',
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    return response.type === 'opaque';
  } catch (e) {
    return false;
  }
};

/**
 * Check required permissions
 */
export const checkPermissions = () => {
  // In a browser context we might check for permissions like
  // notifications, camera, etc. This is just a placeholder.
  return { valid: true, issues: [] };
};
