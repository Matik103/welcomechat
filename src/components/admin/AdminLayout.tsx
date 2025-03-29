
import React from 'react';
import { AdminHeader } from './AdminHeader';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};
