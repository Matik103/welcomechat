
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Admin Settings</h1>
        <p>Configure system settings.</p>
      </div>
    </AdminLayout>
  );
}
