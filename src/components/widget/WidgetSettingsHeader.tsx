
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface WidgetSettingsHeaderProps {
  onBack: () => void;
}

export function WidgetSettingsHeader({ onBack }: WidgetSettingsHeaderProps) {
  return (
    <div className="mb-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <h1 className="text-2xl font-bold">Widget Settings</h1>
      <p className="text-gray-500">Customize how your chat widget looks and behaves</p>
    </div>
  );
}
