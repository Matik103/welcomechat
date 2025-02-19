
import { Button } from "@/components/ui/button";
import { Monitor } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";

interface WidgetPreviewProps {
  settings: WidgetSettings;
  showPreview: boolean;
  onTogglePreview: () => void;
}

export function WidgetPreview({ settings, showPreview, onTogglePreview }: WidgetPreviewProps) {
  if (!showPreview) {
    return (
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onTogglePreview}>
          <Monitor className="w-4 h-4 mr-2" />
          Show Preview
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={onTogglePreview}>
          <Monitor className="w-4 h-4 mr-2" />
          Hide Preview
        </Button>
      </div>
      <div className="border rounded-lg h-[500px] relative">
        <div className="absolute bottom-4 right-4 w-96 h-[450px] border rounded-lg shadow-lg bg-white">
          <div
            className="h-12 flex items-center px-4 rounded-t-lg"
            style={{ backgroundColor: settings.chat_color }}
          >
            <div className="flex items-center gap-3">
              {settings.logo_url && (
                <img
                  src={settings.logo_url}
                  alt="Agent logo"
                  className="w-8 h-8 rounded object-contain bg-white"
                />
              )}
              <span className="font-medium text-white">
                {settings.agent_name || "AI Agent"}
              </span>
            </div>
          </div>
          <div
            className="flex-1 p-4 overflow-y-auto"
            style={{
              backgroundColor: settings.background_color,
              color: settings.text_color,
            }}
          >
            <div className="text-center text-sm opacity-50 my-8">
              This is a preview of how your widget will look
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
