
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Client } from '@/types/client';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CalendarClock, 
  Mail, 
  Building, 
  Activity,
  Users,
  Settings,
  Clock,
  Calendar,
  Trash,
  Undo
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ActivityType } from '@/types/client-form';

interface ClientDetailsCardProps {
  client: Client | null;
  clientId: string | undefined;
  isClientView: boolean;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Record<string, any>) => Promise<void>;
}

export const ClientDetailsCard: React.FC<ClientDetailsCardProps> = ({ 
  client, 
  clientId,
  isClientView,
  logClientActivity
}) => {
  if (!client) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
          <CardDescription>Information about the client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-500">No client information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const isDeleted = !!client.deleted_at;
  const statusBadgeVariant = client.status === 'active' ? 'success' : 'warning';
  
  // Safely format dates and handle null/undefined values
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // For time ago formatting
  const getTimeAgo = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Safely handle account deletion time if scheduled
  const deletionTime = client.deletion_scheduled_at ? 
    getTimeAgo(client.deletion_scheduled_at) : 
    'Not scheduled';

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl font-bold">{client.client_name || 'Unnamed Client'}</CardTitle>
          <CardDescription className="mt-1">
            <Badge variant={statusBadgeVariant} className="mr-2">
              {isDeleted ? 'Deleted' : client.status || 'Unknown Status'}
            </Badge>
            {isDeleted && (
              <Badge variant="destructive">Deleted {getTimeAgo(client.deleted_at)}</Badge>
            )}
          </CardDescription>
        </div>
        
        {!isClientView && (
          <div className="space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/admin/clients/edit/${clientId}`}>
                <Settings className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={client.email || 'N/A'} />
          <InfoItem icon={<Building className="h-4 w-4" />} label="Company" value={client.company || 'N/A'} />
          
          <InfoItem 
            icon={<Activity className="h-4 w-4" />} 
            label="Status" 
            value={client.status === 'active' ? 'Active' : client.status || 'N/A'} 
          />
          
          <InfoItem 
            icon={<Calendar className="h-4 w-4" />} 
            label="Created" 
            value={formatDate(client.created_at)} 
            subtext={getTimeAgo(client.created_at)}
          />
          
          <InfoItem 
            icon={<CalendarClock className="h-4 w-4" />} 
            label="Last Active" 
            value={formatDate(client.last_active)} 
            subtext={client.last_active ? getTimeAgo(client.last_active) : 'Never'}
          />
          
          {isDeleted && (
            <InfoItem 
              icon={<Trash className="h-4 w-4" />} 
              label="Deleted" 
              value={formatDate(client.deleted_at)} 
              subtext={getTimeAgo(client.deleted_at)}
            />
          )}
          
          {client.deletion_scheduled_at && !isDeleted && (
            <InfoItem 
              icon={<Clock className="h-4 w-4" />} 
              label="Scheduled for Deletion" 
              value={formatDate(client.deletion_scheduled_at)} 
              subtext={deletionTime}
              important
            />
          )}
        </div>
        
        {client.description && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <p className="text-sm text-gray-600">{client.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  important?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, subtext, important }) => {
  return (
    <div className="flex items-start space-x-3 text-sm">
      <div className="text-gray-500 mt-0.5">{icon}</div>
      <div>
        <span className="text-gray-500">{label}:</span>
        <span className={`ml-1 font-medium ${important ? 'text-red-600' : ''}`}>{value}</span>
        {subtext && <div className="text-xs text-gray-500 mt-0.5">{subtext}</div>}
      </div>
    </div>
  );
};
