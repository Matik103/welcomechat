
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { WidgetSettings } from "@/types/widget-settings";

interface WidgetFormProps {
  initialSettings?: WidgetSettings;
  onSave: (settings: WidgetSettings) => Promise<void>;
}

const WidgetForm = ({ initialSettings, onSave }: WidgetFormProps) => {
  const [settings, setSettings] = useState<WidgetSettings>(
    initialSettings || {
      appearance: {
        theme: "light",
        chatBubbleColor: "#000000",
        position: "bottom-right",
      },
      branding: {
        name: "",
        logo: "",
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(settings);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Widget Settings</h3>
          <p className="text-sm text-gray-500">Customize how your widget appears and functions.</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Widget Name</label>
            <Input
              type="text"
              value={settings.branding.name}
              onChange={(e) => setSettings({
                ...settings,
                branding: { ...settings.branding, name: e.target.value }
              })}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Theme</label>
            <select
              value={settings.appearance.theme}
              onChange={(e) => setSettings({
                ...settings,
                appearance: { ...settings.appearance, theme: e.target.value as "light" | "dark" }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Chat Bubble Color</label>
            <Input
              type="color"
              value={settings.appearance.chatBubbleColor}
              onChange={(e) => setSettings({
                ...settings,
                appearance: { ...settings.appearance, chatBubbleColor: e.target.value }
              })}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <select
              value={settings.appearance.position}
              onChange={(e) => setSettings({
                ...settings,
                appearance: { ...settings.appearance, position: e.target.value as "bottom-right" | "bottom-left" }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit">Save Changes</Button>
        </div>
      </div>
    </Form>
  );
};

export default WidgetForm;
