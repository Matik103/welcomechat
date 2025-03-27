
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Eye, Settings } from 'lucide-react';

interface ClientActionsProps {
  clientId: string;
  onViewClick?: () => void;
  onSettingsClick?: () => void;
  onDeleteClick?: () => void;
}

export function ClientActions({ 
  clientId,
  onViewClick,
  onSettingsClick,
  onDeleteClick 
}: ClientActionsProps) {
  return (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onViewClick}
        asChild
      >
        <Link to={`/admin/clients/view/${clientId}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">View client</span>
        </Link>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onSettingsClick}
        asChild
      >
        <Link to={`/admin/clients/${clientId}/edit-info`}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Edit client settings</span>
        </Link>
      </Button>
    </div>
  );
}
