
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Analytics Dashboard</h1>
        <p>View system analytics and metrics.</p>
      </div>
    </AdminLayout>
  );
}
