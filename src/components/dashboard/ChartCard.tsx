
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartCardProps {
  title: string;
  data: { name: string; value: number }[];
  className?: string;
}

export function ChartCard({ title, data, className }: ChartCardProps) {
  const colors = ['#4F46E5', '#7C3AED', '#2563EB', '#8B5CF6', '#3B82F6'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p>{payload[0].value} queries</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {data.length > 0 ? (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 10,
                  right: 10,
                  left: 10,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
