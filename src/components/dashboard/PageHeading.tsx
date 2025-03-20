
import React from 'react';

interface PageHeadingProps {
  children: React.ReactNode;
  description?: string;
}

export function PageHeading({ children, description }: PageHeadingProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{children}</h1>
      {description && (
        <p className="text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
}
