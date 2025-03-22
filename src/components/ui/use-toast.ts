
// This file now redirects to sonner toast to avoid duplicate toasts
import { toast as sonnerToast } from "sonner";

// This allows us to maintain backward compatibility with existing code
// while actually using the sonner toast system
const useToast = () => {
  return {
    toast: {
      // Support the old object calling pattern
      ...((args: any) => {
        if (typeof args === 'string') {
          return sonnerToast(args);
        }
        
        if (args && typeof args === 'object') {
          if (args.title) {
            if (args.variant === 'destructive') {
              return sonnerToast.error(args.title, {
                description: args.description,
                id: args.id
              });
            } else {
              return sonnerToast.success(args.title, {
                description: args.description,
                id: args.id
              });
            }
          }
        }
        
        return sonnerToast(args);
      }),
      // Direct method calls
      success: (message: string, options?: any) => sonnerToast.success(message, options),
      error: (message: string, options?: any) => sonnerToast.error(message, options),
      loading: (message: string, options?: any) => sonnerToast.loading(message, options),
      dismiss: (id?: string) => sonnerToast.dismiss(id),
    },
    toasts: [], // Empty array to satisfy the type requirements
  };
};

export { useToast, sonnerToast as toast };
