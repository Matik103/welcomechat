
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Client } from '@/types/client';

interface ClientDetailsCardProps {
  client: Client | null;
  isLoading?: boolean;
}

export function ClientDetailsCard({ client, isLoading = false }: ClientDetailsCardProps) {
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!client) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No client data available</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'secondary';
      case 'inactive':
        return 'outline';
      case 'suspended':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Format creation date as time ago
  const timeAgo = client.created_at
    ? formatDistanceToNow(new Date(client.created_at), { addSuffix: true })
    : 'unknown';

  // Format last active time
  const lastActive = client.last_active
    ? formatDistanceToNow(new Date(client.last_active), { addSuffix: true })
    : 'never';

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Client Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <Badge variant={getStatusBadgeVariant(client.status || 'unknown')}>
              {client.status ? client.status.toString() : 'Unknown'}
            </Badge>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Created</h3>
            <p className="text-sm">{timeAgo}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Last Active</h3>
            <p className="text-sm">{lastActive}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Company</h3>
            <p className="text-sm">{client.company || 'Not specified'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="text-sm break-words">{client.email}</p>
          </div>

          {client.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="text-sm">{client.description}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
