
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WidgetSettings } from "@/types/widget-settings";
import { useState } from "react";

interface AppearanceSettingsProps {
  settings: WidgetSettings;
  onSettingsChange: (newSettings: Partial<WidgetSettings>) => void;
}

// Define color palettes
const colorPalettes = [
  {
    name: "Purple",
    primary: "#854fff",
    secondary: "#6b3fd4",
    background: "#ffffff",
    text: "#333333"
  },
  {
    name: "Ocean Blue",
    primary: "#0EA5E9",
    secondary: "#0284C7",
    background: "#F0F9FF",
    text: "#0F172A"
  },
  {
    name: "Forest Green",
    primary: "#22C55E",
    secondary: "#16A34A",
    background: "#F0FDF4",
    text: "#14532D"
  },
  {
    name: "Coral",
    primary: "#F97316",
    secondary: "#EA580C",
    background: "#FFF7ED",
    text: "#7C2D12"
  },
  {
    name: "Slate",
    primary: "#475569",
    secondary: "#334155",
    background: "#F8FAFC",
    text: "#0F172A"
  },
  {
    name: "Rose",
    primary: "#F43F5E",
    secondary: "#E11D48",
    background: "#FFF1F2",
    text: "#881337"
  }
];

export function AppearanceSettings({ settings, onSettingsChange }: AppearanceSettingsProps) {
  const [showPalettes, setShowPalettes] = useState(false);

  const applyPalette = (palette: typeof colorPalettes[0]) => {
    onSettingsChange({
      chat_color: palette.primary,
      secondary_color: palette.secondary,
      background_color: palette.background,
      text_color: palette.text
    });
    setShowPalettes(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Color Palette</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => setShowPalettes(!showPalettes)}
          >
            {showPalettes ? 'Hide Palettes' : 'Show Palettes'}
          </Button>
        </div>
        
        {showPalettes && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {colorPalettes.map((palette) => (
              <div 
                key={palette.name}
                className="border rounded-md p-3 cursor-pointer hover:border-primary transition-colors"
                onClick={() => applyPalette(palette)}
              >
                <div className="text-sm font-medium mb-2">{palette.name}</div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: palette.primary }}></div>
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: palette.secondary }}></div>
                  <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: palette.background }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="chat_color">Primary Color</Label>
          <div className="flex gap-2 items-center mt-1">
            <div 
              className="w-8 h-8 rounded-md border"
              style={{ backgroundColor: settings.chat_color }}
            ></div>
            <Input
              id="chat_color"
              type="color"
              value={settings.chat_color}
              onChange={(e) => onSettingsChange({ chat_color: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="secondary_color">Secondary Color</Label>
          <div className="flex gap-2 items-center mt-1">
            <div 
              className="w-8 h-8 rounded-md border"
              style={{ backgroundColor: settings.secondary_color }}
            ></div>
            <Input
              id="secondary_color"
              type="color"
              value={settings.secondary_color}
              onChange={(e) => onSettingsChange({ secondary_color: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="background_color">Background Color</Label>
          <div className="flex gap-2 items-center mt-1">
            <div 
              className="w-8 h-8 rounded-md border"
              style={{ backgroundColor: settings.background_color }}
            ></div>
            <Input
              id="background_color"
              type="color"
              value={settings.background_color}
              onChange={(e) => onSettingsChange({ background_color: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="text_color">Text Color</Label>
          <div className="flex gap-2 items-center mt-1">
            <div 
              className="w-8 h-8 rounded-md border"
              style={{ backgroundColor: settings.text_color }}
            ></div>
            <Input
              id="text_color"
              type="color"
              value={settings.text_color}
              onChange={(e) => onSettingsChange({ text_color: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="position">Widget Position</Label>
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
