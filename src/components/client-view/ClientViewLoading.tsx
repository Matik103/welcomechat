
import React from 'react';

export const ClientViewLoading: React.FC = () => {
  return (
    <div className="container py-12 flex justify-center items-center min-h-[60vh]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};
