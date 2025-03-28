import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import './AnimatedBarChart.css';

interface AnimatedBarChartProps {
  data: number[];
  height?: number;
  color?: string;
  className?: string;
  updateInterval?: number;
}

export function AnimatedBarChart({
  data,
  height = 80,
  color = '#10B981',
  className,
  updateInterval = 1000
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
          const newData = [...prev.slice(1), data[data.length - 1]];
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

  const maxValue = Math.max(...displayData);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        className
      )}
      style={{ height: `${height}px` }}
    >
      <div className="absolute inset-0 flex items-end space-x-1">
        {displayData.map((value, index) => {
          const barHeight = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <div
              key={index}
              className="flex-1 rounded-sm transition-all duration-300 ease-in-out hover:opacity-80"
              style={{
                height: `${barHeight}%`,
                backgroundColor: color,
                minHeight: '1px',
                animation: 'barFlow 2s linear infinite',
                animationDelay: `${index * 0.1}s`
              }}
            />
          );
        })}
      </div>
    </div>
  );
} 