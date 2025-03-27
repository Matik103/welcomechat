
import React from 'react';

interface BarChartDataItem {
  name: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDataItem[];
  color?: string;
}

export function BarChart({ data, color = '#4F46E5' }: BarChartProps) {
  // Find the maximum value to scale the chart
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-24 text-sm text-gray-600">{item.name}</div>
            <div className="flex-1">
              <div 
                className="h-6 rounded-sm transition-all duration-300" 
                style={{ 
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: color,
                  minWidth: '8px' // Ensures even very small values are visible
                }}
              />
            </div>
            <div className="ml-2 text-sm text-gray-700">
              {item.name === 'Response Time' 
                ? `${(item.value / 1000).toFixed(2)}s` 
                : item.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
