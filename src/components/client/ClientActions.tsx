import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Eye, Settings, Trash2, Layout } from 'lucide-react';

interface ClientActionsProps {
  clientId: string;
  onViewClick?: () => void;
  onSettingsClick?: () => void;
  onDeleteClick?: () => void;
  onWidgetSettingsClick?: () => void;
  disabled?: boolean;
}

export function ClientActions({ 
  clientId,
  onViewClick,
  onSettingsClick,
  onDeleteClick,
  onWidgetSettingsClick,
  disabled = false
}: ClientActionsProps) {
  return (
    <div className={`flex space-x-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onViewClick}
        asChild
        disabled={disabled}
      >
        <Link to={`/admin/clients/view/${clientId}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">View client</span>
        </Link>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onWidgetSettingsClick}
        asChild
        disabled={disabled}
      >
        <Link to={`/admin/clients/${clientId}/widget-settings`}>
          <Layout className="h-4 w-4" />
          <span className="sr-only">Widget settings</span>
        </Link>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onSettingsClick}
        asChild
        disabled={disabled}
      >
        <Link to={`/admin/clients/${clientId}/edit-info`}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Edit client settings</span>
        </Link>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onDeleteClick}
        title="Schedule client deletion"
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
        <span className="sr-only">Delete client</span>
      </Button>
    </div>
  );
}
