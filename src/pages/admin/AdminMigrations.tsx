
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminMigrationsPage() {
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Database Migrations</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p>Database migrations have been disabled in this version.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
