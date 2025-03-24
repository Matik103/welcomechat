
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminMigrationsPage() {
  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Database Migrations</h1>
        <p>Manage database migrations.</p>
      </div>
    </AdminLayout>
  );
}
