
import React, { useState, useEffect } from 'react';

interface BarChartDataItem {
  name: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDataItem[];
  color?: string;
  animated?: boolean;
}

export function BarChart({ data, color = '#4F46E5', animated = true }: BarChartProps) {
  // Track current and previous values for animation
  const [currentData, setCurrentData] = useState<BarChartDataItem[]>(data);
  const [animating, setAnimating] = useState(false);
  
  // Find the maximum value to scale the chart
  const maxValue = Math.max(...currentData.map(item => item.value), 1);

  // Update data with animation
  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(currentData)) {
      setAnimating(true);
      
      // Animate to new values
      const timeout = setTimeout(() => {
        setCurrentData(data);
        setAnimating(false);
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [data, currentData]);

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-2">
        {currentData.map((item: BarChartDataItem, index: number) => (
          <div key={index} className="flex items-center">
            <div className="w-24 text-sm text-gray-600">{item.name}</div>
            <div className="flex-1">
              <div 
                className={`h-6 rounded-sm ${animated ? 'transition-all duration-500 ease-out' : ''} ${animating ? 'opacity-80' : ''}`}
                style={{ 
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: color,
                  minWidth: '8px', // Ensures even very small values are visible
                  transform: animating ? 'scaleX(0.98)' : 'scaleX(1)',
                  transformOrigin: 'left',
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
