
import React from 'react';
import { Loader2 } from 'lucide-react';

export const WebsiteUrlsLoading: React.FC = () => {
  return (
    <div className="text-center py-4">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="mt-2 text-sm text-muted-foreground">Loading website URLs...</p>
    </div>
  );
};

export default WebsiteUrlsLoading;
