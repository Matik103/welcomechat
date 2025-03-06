
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { WidgetSettings } from "@/types/widget-settings";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WidgetFormProps {
  initialSettings?: WidgetSettings;
  onSave: (settings: WidgetSettings) => Promise<void>;
}

const WidgetForm = ({ initialSettings, onSave }: WidgetFormProps) => {
  const form = useForm<WidgetSettings>({
    defaultValues: initialSettings || {
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
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Widget Settings</h3>
          <p className="text-sm text-gray-500">Customize how your widget appears and functions.</p>
        </div>
        
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="branding.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Widget Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="appearance.theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Theme</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="appearance.chatBubbleColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chat Bubble Color</FormLabel>
                <FormControl>
                  <Input type="color" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="appearance.position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a position" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
};

export default WidgetForm;
