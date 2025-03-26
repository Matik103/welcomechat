
import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ActivityChartCardProps {
  title: string;
  subtitle: string;
  value: string | number;
  data: Array<{ name: string; value: number }>;
  icon?: React.ReactNode;
  className?: string;
}

export const ActivityChartCard = ({
  title,
  subtitle,
  value,
  data,
  icon,
  className
}: ActivityChartCardProps) => {
  return (
    <Card className={cn("bg-gray-900 text-white overflow-hidden", className)}>
      <div className="p-4">
        <div className="flex items-center mb-2">
          {icon && <div className="mr-2 text-gray-400">{icon}</div>}
          <h3 className="font-medium text-gray-300">{title}</h3>
        </div>
        <div className="text-sm text-gray-400 mb-1">{subtitle}</div>
        <div className="text-2xl font-bold mb-4">{value}</div>
        
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis 
                dataKey="name" 
                tick={false}
                axisLine={false}
              />
              <YAxis 
                hide={true}
              />
              <Tooltip 
                cursor={{fill: 'rgba(255, 255, 255, 0.1)'}}
                contentStyle={{
                  backgroundColor: '#1e1e1e',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#10B981" 
                radius={[2, 2, 0, 0]} 
                barSize={6}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Mar 22, 9am</span>
          <span>Mar 23, 9am</span>
        </div>
      </div>
    </Card>
  );
};
