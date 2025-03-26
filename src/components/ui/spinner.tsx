
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-8 w-8 border-3",
  };
  
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-t-primary border-b-primary border-r-transparent border-l-transparent",
        sizeClasses[size],
        className
      )}
    ></div>
  );
}
