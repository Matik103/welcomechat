
import React from 'react';
import { Card } from '@/components/ui/card';

const WebsiteUrlsListEmpty: React.FC = () => {
  return (
    <Card className="p-4 text-center text-muted-foreground">
      No website URLs have been added yet.
    </Card>
  );
};

export default WebsiteUrlsListEmpty;
