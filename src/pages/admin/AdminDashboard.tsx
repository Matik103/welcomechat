
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p>Welcome to the admin dashboard.</p>
      </div>
    </AdminLayout>
  );
}
