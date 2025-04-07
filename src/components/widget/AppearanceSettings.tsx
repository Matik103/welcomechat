
import { WidgetSettings } from "@/types/widget-settings";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AppearanceSettingsProps {
  settings: WidgetSettings;
  onSettingsChange: (newSettings: Partial<WidgetSettings>) => void;
}

export function AppearanceSettings({
  settings,
  onSettingsChange
}: AppearanceSettingsProps) {
  return (
    <div className="space-y-6">
      <FormField
        name="chat_color"
        render={() => (
          <FormItem>
            <FormLabel>Primary Color</FormLabel>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                className="w-10 h-10 p-1 cursor-pointer"
                value={settings.chat_color || settings.color || "#4F46E5"}
                onChange={(e) => onSettingsChange({ 
                  chat_color: e.target.value,
                  color: e.target.value 
                })}
              />
              <Input
                type="text"
                value={settings.chat_color || settings.color || "#4F46E5"}
                onChange={(e) => onSettingsChange({ 
                  chat_color: e.target.value,
                  color: e.target.value 
                })}
                className="flex-1"
              />
            </div>
            <FormDescription>
              This color will be used for the chat header and buttons
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        name="position"
        render={() => (
          <FormItem className="space-y-3">
            <FormLabel>Widget Position</FormLabel>
            <FormControl>
              <RadioGroup
                value={settings.position || "right"}
                onValueChange={(value: "left" | "right") => onSettingsChange({ position: value })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left" id="left" />
                  <label htmlFor="left" className="cursor-pointer">Left</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right" id="right" />
                  <label htmlFor="right" className="cursor-pointer">Right</label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormDescription>
              Choose which side of the screen the widget should appear on
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        name="display_mode"
        render={() => (
          <FormItem>
            <FormLabel>Display Mode</FormLabel>
            <Select
              value={settings.display_mode || "floating"}
              onValueChange={(value) => onSettingsChange({ display_mode: value })}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select display mode" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="floating">Floating Button</SelectItem>
                <SelectItem value="inline">Inline Chat</SelectItem>
                <SelectItem value="sidebar">Sidebar Panel</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              How the chat widget should be displayed on your website
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        name="greeting_message"
        render={() => (
          <FormItem>
            <FormLabel>Welcome Message</FormLabel>
            <FormControl>
              <Input
                placeholder="Hello! How can I help you today?"
                value={settings.greeting_message || settings.welcome_message || ""}
                onChange={(e) => onSettingsChange({ 
                  greeting_message: e.target.value,
                  welcome_message: e.target.value
                })}
              />
            </FormControl>
            <FormDescription>
              The message shown when a user opens the chat
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        name="background_opacity"
        render={() => (
          <FormItem>
            <FormLabel>
              Background Opacity: {((settings.background_opacity || 1) * 100).toFixed(0)}%
            </FormLabel>
            <FormControl>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[settings.background_opacity || 1]}
                onValueChange={(values) => onSettingsChange({ background_opacity: values[0] })}
              />
            </FormControl>
            <FormDescription>
              Adjust the opacity of the widget background
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        name="fontFamily"
        render={() => (
          <FormItem>
            <FormLabel>Font Family</FormLabel>
            <Select
              value={settings.fontFamily || "Inter, system-ui, sans-serif"}
              onValueChange={(value) => onSettingsChange({ fontFamily: value })}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select font family" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Inter, system-ui, sans-serif">Inter</SelectItem>
                <SelectItem value="'Arial', sans-serif">Arial</SelectItem>
                <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
}
