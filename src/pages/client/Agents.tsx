
import React from 'react';
import { ClientHeader } from '@/components/client/ClientHeader';
import { useAuth } from '@/contexts/AuthContext';
import { ClientViewLoading } from '@/components/client-view/ClientViewLoading';
import { useClientActivity } from '@/hooks/useClientActivity';
import { useMountEffect } from '@/hooks/useMountEffect';

export default function ClientAgents() {
  const { user, clientId } = useAuth();
  const { logClientActivity } = useClientActivity(clientId || "");

  // Log page view when component mounts
  useMountEffect(() => {
    if (clientId) {
      logClientActivity("agents_page_viewed", "Agents page viewed");
    }
  });

  if (!clientId) {
    return <ClientViewLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Your AI Agents</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Your AI agents will appear here. Check back soon for updates.
          </p>
        </div>
      </div>
    </div>
  );
}
