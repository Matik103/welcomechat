
// This file now redirects to sonner toast to avoid duplicate toasts
import { toast } from "sonner";

// This allows us to maintain backward compatibility with existing code
// while actually using the sonner toast system
const useToast = () => {
  return {
    toast: {
      // Simplified wrapper that maps to sonner's toast functions
      success: (message: string) => toast.success(message),
      error: (message: string) => toast.error(message),
      loading: (message: string) => toast.loading(message),
      dismiss: (id?: string) => toast.dismiss(id),
    },
    toasts: [], // Empty array to satisfy the type requirements
  };
};

export { useToast, toast };
