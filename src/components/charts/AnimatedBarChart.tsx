
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBarChartProps {
  data: number[];
  color?: string;
  barWidth?: number;
  height?: number;
  animated?: boolean;
  className?: string;
  scrollSpeed?: number;
}

export function AnimatedBarChart({
  data,
  color = '#4F46E5',
  barWidth = 4,
  height = 40,
  animated = true,
  className,
  scrollSpeed = 100 // Time in ms for each step of the animation
}: AnimatedBarChartProps) {
  // Create a wider dataset by duplicating the data for continuous scrolling
  const extendedData = [...data, ...data, ...data]; // Triple the data for smooth scrolling
  const [position, setPosition] = useState(0);
  const [visibleData, setVisibleData] = useState<number[]>(data);
  const [maxValue, setMaxValue] = useState(Math.max(...data, 1));
  // Change the type from number to NodeJS.Timeout
  const animationRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate how many bars can fit in the container
  const calculateVisibleBars = (): number => {
    if (!containerRef.current) return data.length;
    const containerWidth = containerRef.current.clientWidth;
    return Math.floor(containerWidth / (barWidth + 1)); // +1 for the gap
  };

  useEffect(() => {
    // Initial update of visible data slice
    const visibleBars = calculateVisibleBars();
    const startIdx = position % data.length;
    const newVisibleData = [...extendedData.slice(startIdx, startIdx + visibleBars * 2)]; // Get more data than needed for smooth transition
    setVisibleData(newVisibleData);
    setMaxValue(Math.max(...newVisibleData, 1));
  }, [data, position]);

  useEffect(() => {
    if (!animated) return;

    const animate = () => {
      setPosition(prev => (prev + 1) % (data.length * 2)); // Cycle through the data twice to create a smooth loop
      
      // Update visible data slice
      const visibleBars = calculateVisibleBars();
      const startIdx = position % data.length;
      const newVisibleData = [...extendedData.slice(startIdx, startIdx + visibleBars * 2)];
      setVisibleData(newVisibleData);
      setMaxValue(Math.max(...newVisibleData, 1));
      
      animationRef.current = setTimeout(animate, scrollSpeed);
    };

    animationRef.current = setTimeout(animate, scrollSpeed);
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [animated, data, position, scrollSpeed]);

  return (
    <div className={cn("w-full overflow-hidden", className)} ref={containerRef}>
      <div 
        className="flex items-end space-x-1" 
        style={{ height: `${height}px` }}
      >
        {visibleData.map((value, index) => {
          const barHeight = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <div
              key={`bar-${index}-${position}`}
              className={cn(
                "rounded-sm transition-all duration-300 ease-out",
                "hover:opacity-80"
              )}
              style={{
                height: `${barHeight}%`,
                backgroundColor: color,
                width: `${barWidth}px`,
                minHeight: '1px',
                transform: `translateX(-${position}px)`,
                opacity: 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
