import React from 'react';
import { AdminHeader } from './AdminHeader';
import { ErrorBoundary } from '../ErrorBoundary';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex-1 overflow-auto">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
};
