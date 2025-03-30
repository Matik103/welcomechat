
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface WidgetSettingsHeaderProps {
  onBack: () => void;
}

export function WidgetSettingsHeader({ onBack }: WidgetSettingsHeaderProps) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="mb-4 flex items-center gap-1"
      onClick={onBack}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Dashboard
    </Button>
  );
}
