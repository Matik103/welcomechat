
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Eye, Settings, Trash2, Layout } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ClientActionsProps {
  clientId: string;
  onViewClick?: () => void;
  onSettingsClick?: () => void;
  onDeleteClick?: () => void;
  onWidgetSettingsClick?: () => void;
}

export function ClientActions({ 
  clientId,
  onViewClick,
  onSettingsClick,
  onDeleteClick,
  onWidgetSettingsClick 
}: ClientActionsProps) {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  // Set correct paths based on user role
  const viewPath = `/admin/clients/view/${clientId}`;
  const widgetPath = isAdmin ? `/admin/clients/${clientId}/widget-settings` : '/client/widget-settings';
  const editPath = isAdmin ? `/admin/clients/${clientId}/edit-info` : '/client/edit-info';

  return (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onViewClick}
        asChild
      >
        <Link to={viewPath}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">View client</span>
        </Link>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onWidgetSettingsClick}
        asChild
      >
        <Link to={widgetPath}>
          <Layout className="h-4 w-4" />
          <span className="sr-only">Widget settings</span>
        </Link>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onSettingsClick}
        asChild
      >
        <Link to={editPath}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Edit client settings</span>
        </Link>
      </Button>
      
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDeleteClick}
          title="Schedule client deletion"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="sr-only">Delete client</span>
        </Button>
      )}
    </div>
  );
}
