
import { initializeSecrets } from '@/config/env';

// Initialize the application by setting up required configurations
export const initializeApp = async (): Promise<void> => {
  console.log('Initializing application...');
  
  try {
    // Initialize secrets from Supabase if not available from environment
    await initializeSecrets();
    
    console.log('Application initialization complete');
  } catch (error) {
    console.error('Error during application initialization:', error);
  }
};

// Export for use in main.tsx or App.tsx
export default initializeApp;
