
import { Loader2 } from "lucide-react";

export const LoadingFallback = () => (
  <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
    <div className="flex flex-col items-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">Loading application...</p>
    </div>
  </div>
);
