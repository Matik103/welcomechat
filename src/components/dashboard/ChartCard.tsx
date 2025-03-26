
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartCardProps {
  title: string;
  data: { query: string; count: number }[];
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, data, className }) => {
  // Format the data for the chart
  const chartData = data.map(item => ({
    name: truncateText(item.query, 20),
    value: item.count,
    fullText: item.query
  }));

  // Generate colors based on the count value
  const getBarColor = (count: number) => {
    // Higher values get more intense colors
    const baseHue = 210; // blue
    const saturation = Math.min(100, 50 + (count * 5));
    const lightness = Math.max(40, 70 - (count * 2));
    
    return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name, props) => [value, 'Count']}
                labelFormatter={(label, props) => props.payload[0]?.payload.fullText || label}
              />
              <Bar dataKey="value" fill="#8884d8">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

// Utility function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
