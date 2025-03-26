import React from 'react';

interface BarChartProps {
  data: number[];
  height?: number;
  color?: string;
}

export function BarChart({ data, height = 80, color = '#10B981' }: BarChartProps) {
  const maxValue = Math.max(...data);

  return (
    <div className="flex items-end space-x-1" style={{ height: `${height}px` }}>
      {data.map((value, index) => {
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
  );
} 