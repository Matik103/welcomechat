
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminLogsPage() {
  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">System Logs</h1>
        <p>View system logs and activity.</p>
      </div>
    </AdminLayout>
  );
}
