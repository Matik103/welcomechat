
import React from 'react';
import { Card } from '@/components/ui/card';
import { AnimatedBarChart } from '@/components/dashboard/AnimatedBarChart';

interface AdminStatCardProps {
  title: string;
  value: number;
  active?: number;
  changePercentage?: number;
  bgColor: string;
  chartData: number[];
  chartColor: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export function AdminStatCard({
  title,
  value,
  active,
  changePercentage,
  bgColor,
  chartData,
  chartColor,
  icon,
  onClick
}: AdminStatCardProps) {
  return (
    <Card
      className={`${bgColor} hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h3 className="font-bold">{title}</h3>
        </div>
        <div className="text-2xl font-bold mb-1">{value.toLocaleString()}</div>
        {active !== undefined && (
          <div className="text-sm opacity-80 mb-1">{active} Active</div>
        )}
        {changePercentage !== undefined && (
          <div className={`text-sm ${changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {changePercentage >= 0 ? `+${changePercentage.toFixed(1)}%` : `${changePercentage.toFixed(1)}%`}
          </div>
        )}
        <div className="h-[40px] mt-3">
          <AnimatedBarChart 
            data={chartData} 
            color={chartColor} 
            updateInterval={150}
          />
        </div>
      </div>
    </Card>
  );
}
