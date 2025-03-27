
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
        "transition-all duration-200 cursor-pointer transform hover:scale-102 hover:shadow-md",
        "rounded-xl shadow-sm",
        bgColor
      )}
      onClick={onClick}
    >
      <div className="p-4">
        <h3 className="text-gray-900 font-semibold text-sm mb-1">
          {title}
        </h3>
        <div className="flex flex-col">
          <span className="text-[42px] leading-[1.1] font-bold text-gray-900 mb-1">
            {value.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            {active !== undefined && (
              <>
                <span className="text-sm text-gray-600">
                  {active} Active
                </span>
                {changePercentage !== undefined && (
                  <span className="text-sm text-green-600 ml-1">
                    +{changePercentage}%
                  </span>
                )}
              </>
            )}
            {active === undefined && changePercentage !== undefined && (
              <span className={cn(
                "text-sm",
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
