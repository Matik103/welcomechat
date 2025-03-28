
import React from 'react';
import { Card } from '@/components/ui/card';
import { AnimatedBarChart } from '@/components/dashboard/AnimatedBarChart';
import { cn } from '@/lib/utils';

interface ActivityChartCardProps {
  title: string;
  subtitle: string;
  value: string | number;
  data: Array<{ name: string; value: number }>;
  icon?: React.ReactNode;
  className?: string;
  color?: string;
}

export const ActivityChartCard = ({
  title,
  subtitle,
  value,
  data,
  icon,
  className,
  color = '#10B981'
}: ActivityChartCardProps) => {
  // Extract values from data for the bar chart
  const chartValues = data.map(item => item.value);

  return (
    <Card className={cn(
      "bg-[#1E1E1E] text-white rounded-xl overflow-hidden",
      className
    )}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {icon && <div className="text-gray-400">{icon}</div>}
          <h3 className="text-gray-300 font-medium">{title}</h3>
        </div>
        <div className="text-sm text-gray-400 mb-1">{subtitle}</div>
        <div className="text-2xl font-bold mb-4">{value.toLocaleString()}</div>
        
        <div className="h-[120px]">
          <AnimatedBarChart 
            data={chartValues} 
            height={120}
            color={color}
            updateInterval={2000}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Mar 22, 9am</span>
          <span>Mar 23, 9am</span>
        </div>
      </div>
    </Card>
  );
};
