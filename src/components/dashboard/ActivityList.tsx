
import React from 'react';
import { ActivityWithClientInfo } from "@/types/activity";
import { ActivityItem } from "./ActivityItem";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ActivityListProps {
  activities?: ActivityWithClientInfo[] | null;
  isLoading?: boolean;
  title?: string;
}

export const ActivityList: React.FC<ActivityListProps> = ({ 
  activities = [], 
  isLoading = false,
  title = "Recent Activities"
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 border-b border-gray-100">
        <CardTitle className="text-gray-800 flex items-center space-x-2">
          <span>{title}</span>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {activities && activities.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            {isLoading ? (
              <div className="flex justify-center items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading activities...</span>
              </div>
            ) : (
              <p>No recent activities found</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
