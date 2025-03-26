import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  active?: number;
  changePercentage?: number;
  bgColor: string;
  chartColor: string;
  onClick?: () => void;
}

const generateMockData = () => {
  return Array.from({ length: 7 }, () => ({
    value: Math.floor(Math.random() * 100)
  }));
};

export const DashboardStatCard = ({
  title,
  value,
  active,
  changePercentage,
  bgColor,
  chartColor,
  onClick
}: DashboardStatCardProps) => {
  const data = React.useMemo(() => generateMockData(), []);

  return (
    <Card 
      className={cn(
        "transition-all duration-300 cursor-pointer group",
        "hover:shadow-lg hover:shadow-gray-200/50 transform hover:-translate-y-1",
        bgColor
      )}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-gray-800 font-semibold text-sm tracking-wide mb-1 group-hover:text-gray-900">
              {title}
            </h3>
            <span className="text-4xl font-bold text-gray-900">
              {value}
            </span>
          </div>
          <div className="w-20 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <Bar 
                  dataKey="value" 
                  fill={chartColor}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {active !== undefined && (
            <span className="text-sm font-medium text-gray-700">
              {active} Active
            </span>
          )}
          {changePercentage !== undefined && (
            <span className={cn(
              "text-sm font-medium",
              changePercentage >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {changePercentage >= 0 ? "+" : ""}{changePercentage}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
