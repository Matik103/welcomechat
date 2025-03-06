
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WidgetSettings } from "@/types/widget-settings";

interface AppearanceSettingsProps {
  settings: WidgetSettings;
  onSettingsChange: (newSettings: Partial<WidgetSettings>) => void;
}

export function AppearanceSettings({ settings, onSettingsChange }: AppearanceSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="chat_color">Primary Color</Label>
          <p className="text-sm text-gray-500 mb-1">Used for the chat bubble and header</p>
          <div className="flex items-center gap-2">
            <Input
              id="chat_color"
              type="color"
              value={settings.chat_color}
              onChange={(e) => onSettingsChange({ chat_color: e.target.value })}
              className="w-16 h-10"
            />
            <Input 
              type="text" 
              value={settings.chat_color} 
              onChange={(e) => onSettingsChange({ chat_color: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="secondary_color">Secondary Color</Label>
          <p className="text-sm text-gray-500 mb-1">Used for message bubbles and accents</p>
          <div className="flex items-center gap-2">
            <Input
              id="secondary_color"
              type="color"
              value={settings.secondary_color}
              onChange={(e) => onSettingsChange({ secondary_color: e.target.value })}
              className="w-16 h-10"
            />
            <Input 
              type="text" 
              value={settings.secondary_color} 
              onChange={(e) => onSettingsChange({ secondary_color: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="background_color">Background Color</Label>
          <p className="text-sm text-gray-500 mb-1">Chat window background</p>
          <div className="flex items-center gap-2">
            <Input
              id="background_color"
              type="color"
              value={settings.background_color}
              onChange={(e) => onSettingsChange({ background_color: e.target.value })}
              className="w-16 h-10"
            />
            <Input 
              type="text" 
              value={settings.background_color} 
              onChange={(e) => onSettingsChange({ background_color: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="text_color">Text Color</Label>
          <p className="text-sm text-gray-500 mb-1">Main text color</p>
          <div className="flex items-center gap-2">
            <Input
              id="text_color"
              type="color"
              value={settings.text_color}
              onChange={(e) => onSettingsChange({ text_color: e.target.value })}
              className="w-16 h-10"
            />
            <Input 
              type="text" 
              value={settings.text_color} 
              onChange={(e) => onSettingsChange({ text_color: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="position">Widget Position</Label>
          <p className="text-sm text-gray-500 mb-1">Position on the page</p>
          <select
            id="position"
            value={settings.position}
            onChange={(e) => onSettingsChange({ position: e.target.value as 'left' | 'right' })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    </div>
  );
}
