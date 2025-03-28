
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBarChartProps {
  data: number[];
  color?: string;
  barWidth?: number;
  height?: number;
  animated?: boolean;
  className?: string;
}

export function AnimatedBarChart({
  data,
  color = '#4F46E5',
  barWidth = 4,
  height = 40,
  animated = true,
  className
}: AnimatedBarChartProps) {
  const [animatedData, setAnimatedData] = useState<number[]>(data.map(() => 0));
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    // Initial animation when component mounts
    const timer = setTimeout(() => {
      setShouldAnimate(true);
      setAnimatedData(data);
    }, 300);

    // Random animation every 3-5 seconds if animated is true
    let intervalId: NodeJS.Timeout;
    if (animated) {
      intervalId = setInterval(() => {
        // Create a new array with slightly randomized values
        const newData = data.map(val => {
          const change = Math.random() * 0.3 - 0.15; // -15% to +15%
          return Math.max(0, val * (1 + change));
        });
        setAnimatedData(newData);
      }, 3000 + Math.random() * 2000); // Random time between 3-5 seconds
    }

    return () => {
      clearTimeout(timer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [data, animated]);

  // Find the maximum value to scale the bars
  const maxValue = Math.max(...(shouldAnimate ? animatedData : data.map(() => 0)));

  return (
    <div className={cn("w-full", className)}>
      <div 
        className="flex items-end space-x-1 w-full" 
        style={{ height: `${height}px` }}
      >
        {animatedData.map((value, index) => {
          const barHeight = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <div
              key={index}
              className={cn(
                "rounded-sm transition-all duration-500 ease-out",
                "hover:opacity-80"
              )}
              style={{
                height: `${barHeight}%`,
                backgroundColor: color,
                width: `${barWidth}px`,
                minHeight: '1px',
                transform: shouldAnimate ? 'translateY(0)' : 'translateY(100%)',
                opacity: shouldAnimate ? 1 : 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
