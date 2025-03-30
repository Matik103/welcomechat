
import React from 'react';
import { Client } from "@/types/client";
import { ClientDetailsCard } from '@/components/client/ClientDetailsCard';
import { ClientForm } from '@/components/client/ClientForm';
import { UseMutationResult } from "@tanstack/react-query";

interface ClientProfileLayoutProps {
  client: Client;
  isLoading: boolean;
  error: string | null;
  onSubmit: (data: any) => Promise<void>;
  logClientActivity: () => Promise<void>;
}

export const ClientProfileLayout: React.FC<ClientProfileLayoutProps> = ({
  client,
  isLoading,
  error,
  onSubmit,
  logClientActivity
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ClientForm 
          initialData={client}
          onSubmit={onSubmit}
          isLoading={isLoading}
          error={error}
          submitButtonText="Update Client"
        />
      </div>
      <div className="lg:col-span-1">
        <ClientDetailsCard 
          client={client} 
          isLoading={isLoading} 
          logClientActivity={logClientActivity}
        />
      </div>
    </div>
  );
};
