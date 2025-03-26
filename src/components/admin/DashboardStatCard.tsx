
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  active?: number;
  changePercentage?: number;
  bgColor: string;
  onClick?: () => void;
}

export const DashboardStatCard = ({
  title,
  value,
  active,
  changePercentage,
  bgColor,
  onClick
}: DashboardStatCardProps) => {
  return (
    <Card 
      className={cn(
        "transition-all duration-200 cursor-pointer hover:shadow-md transform hover:-translate-y-1",
        bgColor
      )}
      onClick={onClick}
    >
      <div className="p-6">
        <h3 className="text-gray-800 font-bold uppercase text-sm tracking-wider mb-2">
          {title}
        </h3>
        <div className="flex flex-col">
          <span className="text-5xl font-bold text-gray-900 mb-3">
            {value}
          </span>
          <div className="flex items-center">
            {active !== undefined && (
              <span className="text-sm text-gray-700 mr-1">
                {active} Active
              </span>
            )}
            {changePercentage !== undefined && (
              <span className={cn(
                "text-sm ml-auto",
                changePercentage >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {changePercentage >= 0 ? "+" : ""}{changePercentage}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
