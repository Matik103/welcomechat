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
  chartColor?: string;
}

export const ActivityChartCard = ({
  title,
  subtitle,
  value,
  data,
  icon,
  className,
  chartColor = '#10B981'
}: ActivityChartCardProps) => {
  return (
    <Card className={cn(
      "bg-white border-gray-100 overflow-hidden transition-all duration-300",
      "hover:shadow-lg hover:shadow-gray-200/50 transform hover:-translate-y-1",
      className
    )}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {icon && (
              <div className="mr-3 p-2 rounded-lg bg-gray-100 text-gray-700">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <div className="text-sm text-gray-500">{subtitle}</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
        
        <div className="h-40 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                dx={-10}
              />
              <Tooltip 
                cursor={{fill: 'rgba(243, 244, 246, 0.6)'}}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
                itemStyle={{ color: '#6B7280' }}
              />
              <Bar 
                dataKey="value" 
                fill={chartColor}
                radius={[4, 4, 0, 0]} 
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
