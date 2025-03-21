
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WidgetSettings, WidgetDisplayMode } from "@/types/widget-settings";
import { CheckIcon, RefreshCcw } from "lucide-react";
import { useState } from "react";

interface AppearanceSettingsProps {
  settings: WidgetSettings;
  onSettingsChange: (newSettings: Partial<WidgetSettings>) => void;
}

// Color presets for quick selection
const COLOR_PRESETS = [
  { 
    name: "Modern Purple", 
    primary: "#7c3aed", 
    secondary: "#6d28d9",
    background: "#ffffff",
    text: "#1f2937" 
  },
  { 
    name: "Ocean Blue", 
    primary: "#0ea5e9", 
    secondary: "#0284c7",
    background: "#f8fafc",
    text: "#334155" 
  },
  { 
    name: "Forest Green", 
    primary: "#16a34a", 
    secondary: "#15803d",
    background: "#f0fdf4",
    text: "#1e293b" 
  },
  { 
    name: "Warm Orange", 
    primary: "#f97316", 
    secondary: "#ea580c",
    background: "#fff7ed",
    text: "#374151" 
  },
  { 
    name: "Rose Pink", 
    primary: "#e11d48", 
    secondary: "#be123c",
    background: "#fff1f2",
    text: "#0f172a" 
  }
];

// Display mode options with descriptions
const DISPLAY_MODES: {
  id: WidgetDisplayMode;
  name: string;
  description: string;
}[] = [
  {
    id: "floating",
    name: "Floating Bubble",
    description: "A chat bubble that floats in the corner of the screen"
  },
  {
    id: "inline",
    name: "Inline Widget",
    description: "Embedded directly within your page content"
  },
  {
    id: "sidebar",
    name: "Sidebar Panel",
    description: "A collapsible panel that slides in from the side"
  }
];

export function AppearanceSettings({ settings, onSettingsChange }: AppearanceSettingsProps) {
  const [showPresets, setShowPresets] = useState(false);

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    onSettingsChange({
      chat_color: preset.primary,
      secondary_color: preset.secondary,
      background_color: preset.background,
      text_color: preset.text
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium">Color Configuration</h3>
        <button 
          onClick={() => setShowPresets(!showPresets)}
          className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <RefreshCcw size={14} />
          {showPresets ? "Hide presets" : "Show color presets"}
        </button>
      </div>

      {showPresets && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {COLOR_PRESETS.map((preset) => (
            <button 
              key={preset.name}
              onClick={() => applyColorPreset(preset)}
              className="p-2 border rounded-md hover:shadow-md transition-shadow flex flex-col items-center"
            >
              <div className="flex gap-1 mb-1">
                <div 
                  className="w-5 h-5 rounded-full border"
                  style={{ backgroundColor: preset.primary }}
                ></div>
                <div 
                  className="w-5 h-5 rounded-full border"
                  style={{ backgroundColor: preset.secondary }}
                ></div>
              </div>
              <span className="text-xs">{preset.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Display Mode Selection - NEW SECTION */}
      <div className="pt-2 border-t border-gray-100">
        <Label className="text-sm font-medium">Display Mode</Label>
        <p className="text-xs text-gray-500 mb-3">Choose how the chat widget appears on your website</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DISPLAY_MODES.map((mode) => (
            <label 
              key={mode.id}
              className={`
                relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all
                ${settings.display_mode === mode.id 
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                  : 'hover:bg-gray-50 border-gray-200'}
              `}
            >
              <input
                type="radio"
                name="display_mode"
                value={mode.id}
                checked={settings.display_mode === mode.id}
                onChange={() => onSettingsChange({ display_mode: mode.id })}
                className="sr-only"
              />
              <div className="font-medium mb-1">{mode.name}</div>
              <div className="text-xs text-gray-500">{mode.description}</div>
              
              {settings.display_mode === mode.id && (
                <div className="absolute top-2 right-2 h-4 w-4 text-indigo-600 flex items-center justify-center">
                  <CheckIcon className="h-4 w-4" />
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="chat_color" className="text-sm font-medium">Primary Color</Label>
            <p className="text-xs text-gray-500 mb-1">Used for the chat bubble and header</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  id="chat_color"
                  type="color"
                  value={settings.chat_color}
                  onChange={(e) => onSettingsChange({ chat_color: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <div 
                  className="absolute inset-0 opacity-0 hover:opacity-100 flex items-center justify-center bg-black/10 transition-opacity rounded"
                >
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <Input 
                type="text" 
                value={settings.chat_color} 
                onChange={(e) => onSettingsChange({ chat_color: e.target.value })}
                className="flex-1"
                placeholder="#854fff"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="secondary_color" className="text-sm font-medium">Secondary Color</Label>
            <p className="text-xs text-gray-500 mb-1">Used for message bubbles and accents</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  id="secondary_color"
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => onSettingsChange({ secondary_color: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <div 
                  className="absolute inset-0 opacity-0 hover:opacity-100 flex items-center justify-center bg-black/10 transition-opacity rounded"
                >
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <Input 
                type="text" 
                value={settings.secondary_color} 
                onChange={(e) => onSettingsChange({ secondary_color: e.target.value })}
                className="flex-1"
                placeholder="#6b3fd4"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="background_color" className="text-sm font-medium">Background Color</Label>
            <p className="text-xs text-gray-500 mb-1">Chat window background</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  id="background_color"
                  type="color"
                  value={settings.background_color}
                  onChange={(e) => onSettingsChange({ background_color: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <div 
                  className="absolute inset-0 opacity-0 hover:opacity-100 flex items-center justify-center bg-black/10 transition-opacity rounded"
                >
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <Input 
                type="text" 
                value={settings.background_color} 
                onChange={(e) => onSettingsChange({ background_color: e.target.value })}
                className="flex-1"
                placeholder="#ffffff"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="text_color" className="text-sm font-medium">Text Color</Label>
            <p className="text-xs text-gray-500 mb-1">Main text color</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  id="text_color"
                  type="color"
                  value={settings.text_color}
                  onChange={(e) => onSettingsChange({ text_color: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <div 
                  className="absolute inset-0 opacity-0 hover:opacity-100 flex items-center justify-center bg-black/10 transition-opacity rounded"
                >
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <Input 
                type="text" 
                value={settings.text_color} 
                onChange={(e) => onSettingsChange({ text_color: e.target.value })}
                className="flex-1"
                placeholder="#333333"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Label htmlFor="position" className="text-sm font-medium">Widget Position</Label>
        <p className="text-xs text-gray-500 mb-1">Position on the page</p>
        <div className="flex gap-3 mt-1">
          <label className={`
            flex-1 flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-all
            ${settings.position === 'left' ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'}
          `}>
            <input
              type="radio"
              name="position"
              value="left"
              checked={settings.position === 'left'}
              onChange={() => onSettingsChange({ position: 'left' })}
              className="sr-only"
            />
            <div className="w-12 h-12 bg-gray-100 rounded-md relative">
              <div 
                className="absolute left-1 bottom-1 w-5 h-5 rounded-full"
                style={{ backgroundColor: settings.chat_color }}
              ></div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Left</div>
              <div className="text-xs text-gray-500">Position on the left side</div>
            </div>
          </label>

          <label className={`
            flex-1 flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-all
            ${settings.position === 'right' ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'}
          `}>
            <input
              type="radio"
              name="position"
              value="right"
              checked={settings.position === 'right'}
              onChange={() => onSettingsChange({ position: 'right' })}
              className="sr-only"
            />
            <div className="w-12 h-12 bg-gray-100 rounded-md relative">
              <div 
                className="absolute right-1 bottom-1 w-5 h-5 rounded-full"
                style={{ backgroundColor: settings.chat_color }}
              ></div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Right</div>
              <div className="text-xs text-gray-500">Position on the right side</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
