
import React, { ReactNode } from 'react';

interface PageHeadingProps {
  children: ReactNode;
}

export const PageHeading: React.FC<PageHeadingProps> = ({ children }) => {
  return (
    <h1 className="text-3xl font-bold tracking-tight">
      {children}
    </h1>
  );
};
