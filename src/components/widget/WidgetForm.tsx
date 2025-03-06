
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "./ColorPicker";
import { Card } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define the widget settings schema
const widgetSettingsSchema = z.object({
  agent_name: z.string().min(1, "Agent name is required"),
  logo_url: z.string().optional(),
  webhook_url: z.string().optional(),
  chat_color: z.string().min(1, "Chat color is required"),
  background_color: z.string().min(1, "Background color is required"),
  text_color: z.string().min(1, "Text color is required"),
});

type WidgetSettingsType = z.infer<typeof widgetSettingsSchema>;

interface WidgetFormProps {
  initialSettings?: any;
  onSave: (settings: WidgetSettingsType) => Promise<void>;
}

const WidgetForm = ({ initialSettings, onSave }: WidgetFormProps) => {
  const [isSaving, setIsSaving] = useState(false);

  // Parse initial settings to ensure they match the schema
  const defaultValues: WidgetSettingsType = {
    agent_name: initialSettings?.agent_name || "",
    logo_url: initialSettings?.logo_url || "",
    webhook_url: initialSettings?.webhook_url || "",
    chat_color: initialSettings?.chat_color || "#854fff",
    background_color: initialSettings?.background_color || "#ffffff",
    text_color: initialSettings?.text_color || "#333333",
  };

  const form = useForm<WidgetSettingsType>({
    resolver: zodResolver(widgetSettingsSchema),
    defaultValues,
  });

  const handleSubmit = async (data: WidgetSettingsType) => {
    setIsSaving(true);
    try {
      await onSave(data);
    } catch (error) {
      console.error("Error saving widget settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Widget Configuration</h2>
          
          <FormField
            control={form.control}
            name="agent_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your AI agent name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="logo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo URL (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/logo.png" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="webhook_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Webhook URL (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://your-webhook.com/endpoint" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-medium">Widget Appearance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="chat_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat Color</FormLabel>
                  <FormControl>
                    <ColorPicker
                      value={field.value}
                      onChange={field.onChange}
                      label="Primary Color"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="background_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Color</FormLabel>
                  <FormControl>
                    <ColorPicker
                      value={field.value}
                      onChange={field.onChange}
                      label="Background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="text_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text Color</FormLabel>
                  <FormControl>
                    <ColorPicker
                      value={field.value}
                      onChange={field.onChange}
                      label="Text"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default WidgetForm;
