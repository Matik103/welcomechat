
import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientDashboardPage() {
  const { user } = useAuth();
  
  return (
    <ClientLayout>
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-4">Client Dashboard</h1>
        <p className="mb-6">Welcome to your client dashboard, {user?.user_metadata?.full_name || user?.email}.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-medium mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <Link to="/client/edit-info">
                <Button variant="outline" className="w-full justify-start">
                  Edit Information
                </Button>
              </Link>
              <Link to="/client/widget-settings">
                <Button variant="outline" className="w-full justify-start">
                  Widget Settings
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-medium mb-4">Help & Resources</h2>
            <p className="text-muted-foreground mb-4">
              Need assistance with your agent? Contact your agent administrator or check the FAQ.
            </p>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
