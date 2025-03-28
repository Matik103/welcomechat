
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface WidgetSettingsHeaderProps {
  onBack: () => void;
}

export function WidgetSettingsHeader({ onBack }: WidgetSettingsHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">Widget Settings</h1>
      <p className="text-gray-500">Customize how your chat widget looks and behaves</p>
    </div>
  );
}
