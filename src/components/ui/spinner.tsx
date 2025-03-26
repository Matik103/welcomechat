
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div
      className={cn("animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary", className)}
    ></div>
  );
}
