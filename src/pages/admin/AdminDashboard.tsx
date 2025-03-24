
import React from 'react';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { VerifyIntegration } from '@/components/dashboard/VerifyIntegration';

const AdminDashboardPage = () => {
  return (
    <AdminLayout>
      <div className="container py-8">
        <PageHeading 
          title="Admin Dashboard" 
          description="Manage your system configuration and integrations" 
        />
        
        <div className="grid gap-6">
          <VerifyIntegration />
          
          {/* Additional dashboard components can be added here */}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
