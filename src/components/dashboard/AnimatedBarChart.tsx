
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import './AnimatedBarChart.css';

interface AnimatedBarChartProps {
  data: number[];
  height?: number;
  color?: string;
  className?: string;
  updateInterval?: number;
  flowing?: boolean;
}

export function AnimatedBarChart({
  data,
  height = 80,
  color = '#10B981',
  className,
  updateInterval = 1000,
  flowing = false
}: AnimatedBarChartProps) {
  const [displayData, setDisplayData] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  // Initialize display data
  useEffect(() => {
    setDisplayData(data);
  }, [data]);

  // Animation effect
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!containerRef.current) return;

      const now = timestamp - lastUpdateRef.current;
      if (now >= updateInterval) {
        // Shift data to the left
        setDisplayData(prev => {
          // Create new data point with slight random variation for visual interest
          const newValue = data[Math.floor(Math.random() * data.length)];
          const jitter = Math.random() * 0.2 - 0.1; // +/- 10% variation
          const newDataPoint = Math.max(1, newValue * (1 + jitter));
          
          const newData = [...prev.slice(1), newDataPoint];
          return newData;
        });
        lastUpdateRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [data, updateInterval]);

  const maxValue = Math.max(...displayData, 1);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        flowing && "flowing-chart",
        className
      )}
      style={{ height: `${height}px` }}
    >
      <div className="absolute inset-0 flex items-end space-x-1">
        {displayData.map((value, index) => {
          const barHeight = (value / maxValue) * 100;
          return (
            <div
              key={index}
              className="flex-1 rounded-sm animated-bar"
              style={{
                height: `${barHeight}%`,
                backgroundColor: color,
                minHeight: '1px',
                animationDelay: `${index * 0.05}s`
              }}
            />
          );
        })}
      </div>
    </div>
  );
} 
