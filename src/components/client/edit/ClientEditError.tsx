
import React from 'react';
import { Button } from "@/components/ui/button";
import ErrorDisplay from '@/components/ErrorDisplay';

interface ClientEditErrorProps {
  title: string;
  message: string;
  details?: string;
  onRetry: () => void;
  onBack?: () => void;
}

export const ClientEditError: React.FC<ClientEditErrorProps> = ({
  title,
  message,
  details,
  onRetry,
  onBack
}) => {
  return (
    <ErrorDisplay 
      title={title}
      message={message}
      details={details}
      onRetry={onRetry}
    />
  );
};
