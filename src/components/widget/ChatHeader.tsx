
import { WidgetSettings } from "@/types/widget-settings";

interface ChatHeaderProps {
  settings: WidgetSettings;
}

export function ChatHeader({ settings }: ChatHeaderProps) {
  return (
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
  );
}
