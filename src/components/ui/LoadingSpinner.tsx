import { Loader2 } from "lucide-react";

export const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-gray-500 mt-2">Loading...</p>
      </div>
    </div>
  );
}; 