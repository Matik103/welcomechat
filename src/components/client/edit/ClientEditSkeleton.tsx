
import React from 'react';

export const ClientEditSkeleton: React.FC = () => {
  return (
    <div className="mt-6 animate-pulse space-y-4">
      <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
      <div className="h-24 bg-gray-200 rounded"></div>
      <div className="h-12 w-1/4 bg-gray-200 rounded"></div>
    </div>
  );
};
