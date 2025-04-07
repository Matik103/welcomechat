
import { useState } from "react";
import { WidgetSettings } from "@/types/widget-settings";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LogoManagement } from "@/components/widget/LogoManagement";

interface BrandingSettingsProps {
  settings: WidgetSettings;
  isUploading: boolean;
  onSettingsChange: (newSettings: Partial<WidgetSettings>) => void;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BrandingSettings({
  settings,
  isUploading,
  onSettingsChange,
  onLogoUpload
}: BrandingSettingsProps) {
  const handleRemoveLogo = () => {
    onSettingsChange({
      logo_url: "",
      logo_storage_path: ""
    });
  };

  return (
    <div className="space-y-6">
      <FormField
        name="agent_name"
        render={() => (
          <FormItem>
            <FormLabel>Agent Name</FormLabel>
            <FormControl>
              <Input
                placeholder="AI Assistant"
                value={settings.agent_name || ""}
                onChange={(e) => onSettingsChange({ agent_name: e.target.value })}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        name="agent_description"
        render={() => (
          <FormItem>
            <FormLabel>Agent Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="A helpful assistant that can answer questions about your content"
                value={settings.agent_description || ""}
                onChange={(e) => onSettingsChange({ agent_description: e.target.value })}
                className="min-h-[80px]"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        name="logo"
        render={() => (
          <FormItem>
            <FormLabel>Chat Widget Logo</FormLabel>
            <FormControl>
              <LogoManagement
                logoUrl={settings.logo_url || ""}
                isUploading={isUploading}
                onLogoUpload={onLogoUpload}
                onRemoveLogo={handleRemoveLogo}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
