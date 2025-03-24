
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Manage Users</h1>
        <p>Admin user management interface.</p>
      </div>
    </AdminLayout>
  );
}
