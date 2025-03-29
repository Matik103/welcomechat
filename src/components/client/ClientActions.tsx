
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Eye, Settings, Trash2, Layout } from 'lucide-react';
import { Client } from '@/types/client';

interface ClientActionsProps {
  clientId: string;
  client?: Client;
  onViewClick?: () => void;
  onSettingsClick?: () => void;
  onDeleteClick?: (client: Client) => void;
  onWidgetSettingsClick?: () => void;
}

export function ClientActions({ 
  clientId,
  client,
  onViewClick,
  onSettingsClick,
  onDeleteClick,
  onWidgetSettingsClick 
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
        onClick={onWidgetSettingsClick}
        asChild
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
      >
        <Link to={`/admin/clients/${clientId}/edit-info`}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Edit client settings</span>
        </Link>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => client && onDeleteClick && onDeleteClick(client)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
        <span className="sr-only">Delete client</span>
      </Button>
    </div>
  );
}
