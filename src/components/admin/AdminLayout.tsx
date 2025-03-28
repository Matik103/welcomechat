
import React from 'react';
import { AdminHeader } from './AdminHeader';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
