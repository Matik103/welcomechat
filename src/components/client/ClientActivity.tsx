
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientActivity as ClientActivityType } from "@/types/client-dashboard";
import { formatDistanceToNow } from 'date-fns';
import { getActivityTypeLabel } from '@/utils/activityTypeUtils';

interface ClientActivityProps {
  activities: ClientActivityType[];
  isLoading: boolean;
  className?: string;
}

export const ClientActivity = ({ 
  activities, 
  isLoading, 
  className 
}: ClientActivityProps) => {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="h-16 bg-gray-100 animate-pulse rounded-md"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No recent activity found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="ai">AI Agent</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <ActivityList activities={activities} />
          </TabsContent>
          
          <TabsContent value="chat" className="mt-0">
            <ActivityList 
              activities={activities.filter(a => 
                a.activity_type === 'chat_interaction'
              )} 
            />
          </TabsContent>
          
          <TabsContent value="ai" className="mt-0">
            <ActivityList 
              activities={activities.filter(a => 
                a.activity_type === 'agent_created' || 
                a.activity_type === 'agent_updated' ||
                a.activity_type === 'ai_agent_created' || 
                a.activity_type === 'ai_agent_updated'
              )} 
            />
          </TabsContent>
          
          <TabsContent value="system" className="mt-0">
            <ActivityList 
              activities={activities.filter(a => 
                a.activity_type !== 'chat_interaction' &&
                a.activity_type !== 'agent_created' && 
                a.activity_type !== 'agent_updated' &&
                a.activity_type !== 'ai_agent_created' && 
                a.activity_type !== 'ai_agent_updated'
              )} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const ActivityList = ({ activities }: { activities: ClientActivityType[] }) => {
  if (activities.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">
        No activities in this category
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div 
          key={activity.id} 
          className="p-3 border rounded-md bg-gray-50"
        >
          <div className="flex items-start justify-between">
            <p className="font-medium text-sm">{activity.description}</p>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {getActivityTypeLabel(activity.activity_type)}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ClientActivity;
