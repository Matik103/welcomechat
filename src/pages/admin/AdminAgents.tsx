
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminAgentsPage() {
  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Manage Agents</h1>
        <p>Admin agent management interface.</p>
      </div>
    </AdminLayout>
  );
}
