
import React from "react";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { Loader2 } from "lucide-react";

interface ActivitySectionProps {
  activities: any[];
  isLoading: boolean;
}

export const ActivitySection: React.FC<ActivitySectionProps> = ({ 
  activities, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-6">
      <ActivityList 
        activities={activities} 
        isLoading={isLoading} 
      />
    </div>
  );
};
