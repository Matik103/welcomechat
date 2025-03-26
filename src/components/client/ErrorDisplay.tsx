
import React from 'react';
import { PageHeading } from '@/components/dashboard/PageHeading';

interface ErrorDisplayProps {
  message?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  message = 'Failed to load clients. Please try refreshing the page.'
}) => {
  return (
    <div className="container mx-auto py-8">
      <PageHeading>
        Client Management
        <p className="text-sm font-normal text-muted-foreground">
          Error loading clients
        </p>
      </PageHeading>
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
        {message}
      </div>
    </div>
  );
};

export default ErrorDisplay;
