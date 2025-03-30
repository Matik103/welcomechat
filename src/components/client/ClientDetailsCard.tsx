
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Client } from '@/types/client';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ClientDetailsCardProps {
  client: Client | null;
  isLoading?: boolean;
  isClientView?: boolean;
  logClientActivity?: () => Promise<void>;
}

export function ClientDetailsCard({ client, isLoading = false, isClientView = false, logClientActivity }: ClientDetailsCardProps) {
  // Log activity when component mounts if function is provided
  useEffect(() => {
    if (logClientActivity) {
      logClientActivity().catch(error => {
        console.error("Error logging client activity in ClientDetailsCard:", error);
      });
    }
  }, [logClientActivity]);

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
    switch (status?.toLowerCase()) {
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

  const timeAgo = client.created_at
    ? formatDistanceToNow(new Date(client.created_at), { addSuffix: true })
    : 'unknown';

  const lastActive = client.last_active
    ? formatDistanceToNow(new Date(client.last_active), { addSuffix: true })
    : 'never';

  const getInitials = () => {
    if (!client.client_name) return 'CL';
    return client.client_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          {client.logo_url ? (
            <AvatarImage 
              src={client.logo_url} 
              alt={client.client_name} 
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">{client.client_name}</CardTitle>
          <p className="text-sm text-muted-foreground">{client.agent_name || 'AI Assistant'}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <Badge variant={getStatusBadgeVariant(client.status || 'unknown')}>
              {client.status || 'Unknown'}
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
