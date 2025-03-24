
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminClientsPage() {
  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Manage Clients</h1>
        <p>Admin client management interface.</p>
      </div>
    </AdminLayout>
  );
}
