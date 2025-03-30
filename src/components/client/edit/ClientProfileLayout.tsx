
import React from 'react';
import { Client } from "@/types/client";
import { ClientDetailsCard } from '@/components/client/ClientDetailsCard';
import { ClientForm } from '@/components/client/ClientForm';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityType, ActivityTypeString } from '@/types/activity';

interface ClientProfileLayoutProps {
  client: Client;
  isLoading: boolean;
  error: string | null;
  onSubmit: (data: any) => Promise<void>;
  logClientActivity: (type: ActivityType | ActivityTypeString, description: string, metadata?: Record<string, any>) => Promise<void>;
}

export const ClientProfileLayout: React.FC<ClientProfileLayoutProps> = ({
  client,
  isLoading,
  error,
  onSubmit,
  logClientActivity
}) => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ClientForm 
          initialData={client}
          onSubmit={onSubmit}
          isLoading={isLoading}
          error={error}
          submitButtonText={isAdmin ? "Update Client" : "Save Changes"}
          isClientView={!isAdmin}
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
