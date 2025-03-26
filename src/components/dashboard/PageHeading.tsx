
import React from 'react';

interface PageHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export const PageHeading = ({ 
  children, 
  className = '' 
}: PageHeadingProps) => {
  return (
    <h1 className={`text-2xl font-bold tracking-tight dashboard-heading ${className}`}>
      {children}
    </h1>
  );
};
