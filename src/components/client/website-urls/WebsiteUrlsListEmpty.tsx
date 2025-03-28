
import React from 'react';
import { Card } from '@/components/ui/card';

export interface WebsiteUrlsListEmptyProps {
  // Add any props if needed
}

export const WebsiteUrlsListEmpty: React.FC<WebsiteUrlsListEmptyProps> = () => {
  return (
    <Card className="p-4 text-center text-muted-foreground">
      No website URLs have been added yet.
    </Card>
  );
};

export default WebsiteUrlsListEmpty;
