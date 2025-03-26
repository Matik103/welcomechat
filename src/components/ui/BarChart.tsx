
import React from 'react';

interface ChartDataItem {
  name: string;
  value: number;
}

interface BarChartProps {
  data: ChartDataItem[];
  color?: string;
}

export function BarChart({ data, color = '#4F46E5' }: BarChartProps) {
  // Extract just the values for the actual chart rendering
  const values = data.map(item => item.value);
  const maxValue = Math.max(...values);

  return (
    <div className="space-y-2">
      <div className="flex items-end space-x-1 h-20">
        {values.map((value, index) => {
          const barHeight = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <div
              key={index}
              className="flex-1 rounded-sm transition-all duration-300 ease-in-out hover:opacity-80"
              style={{
                height: `${barHeight}%`,
                backgroundColor: color,
                minHeight: '1px'
              }}
            />
          );
        })}
      </div>
      
      {/* Display labels below the bars */}
      <div className="flex justify-between text-xs text-gray-500">
        {data.map((item, index) => (
          <div key={index} className="text-center overflow-hidden text-ellipsis whitespace-nowrap">
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
