
import React from 'react';

// Lightweight loading spinner component
export const LoadingSpinner: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-spin rounded-full border-b-2 border-primary ${className}`} />
);

// Global loading overlay
export const LoadingOverlay: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => (
  <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner className="h-10 w-10" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Empty state with actionable button
export interface EmptyStateProps {
  message: string;
  buttonText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  buttonText,
  onAction
}) => (
  <div className="p-8 text-center">
    <p className="text-muted-foreground mb-4">{message}</p>
    {buttonText && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors text-sm"
      >
        {buttonText}
      </button>
    )}
  </div>
);
