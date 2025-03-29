
import React from 'react';
import { Loader2 } from 'lucide-react';

export const ClientViewLoading: React.FC = () => {
  return (
    <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="flex flex-col items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <div className="text-base text-muted-foreground">Loading client view...</div>
      </div>
    </div>
  );
};
