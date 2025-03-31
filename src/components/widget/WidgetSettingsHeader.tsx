
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface WidgetSettingsHeaderProps {
  onBack: () => void;
}

export function WidgetSettingsHeader({ onBack }: WidgetSettingsHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold">Widget Settings</h1>
      <p className="text-sm text-gray-500">Customize how your chat widget looks and behaves</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mt-2 flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
    </div>
  );
}
