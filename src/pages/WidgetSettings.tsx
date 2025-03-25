import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWidgetSettings } from "@/hooks/useWidgetSettings";
import { WidgetPreview } from "@/components/widget/WidgetPreview";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useClientActivity } from "@/hooks/useClientActivity";
import { ActivityType } from "@/types/client-form";
import { LogoManagement } from "@/components/widget/logo/LogoManagement";
import { updateWidgetSettings as updateWidgetSettingsAction } from "@/services/widgetSettingsService";
import { uploadLogo } from "@/services/uploadService";
import { WidgetSettings as WidgetSettingsType } from "@/types/widget-settings";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const widgetSettingsSchema = z.object({
  agent_name: z.string().min(2, {
    message: "Agent name must be at least 2 characters.",
  }),
  agent_description: z.string().optional(),
  welcome_text: z.string().optional(),
  response_time_text: z.string().optional(),
  chat_color: z.string().optional(),
  background_color: z.string().optional(),
  text_color: z.string().optional(),
  secondary_color: z.string().optional(),
  position: z.enum(["bottom-right", "bottom-left", "top-right", "top-left", "left", "right"]).optional(),
  display_mode: z.enum(["floating", "inline", "sidebar"]).optional(),
});

type WidgetSettingsFormValues = z.infer<typeof widgetSettingsSchema>;

export default function WidgetSettings() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const { widgetSettings, isLoading, error, updateWidgetSettings } = useWidgetSettings(clientId || "");
  const { logClientActivity } = useClientActivity(clientId);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null);
  
  const form = useForm<WidgetSettingsFormValues>({
    resolver: zodResolver(widgetSettingsSchema),
    defaultValues: {
      agent_name: widgetSettings?.agent_name || "",
      agent_description: widgetSettings?.agent_description || "",
      welcome_text: widgetSettings?.welcome_text || "",
      response_time_text: widgetSettings?.response_time_text || "",
      chat_color: widgetSettings?.chat_color || "",
      background_color: widgetSettings?.background_color || "",
      text_color: widgetSettings?.text_color || "",
      secondary_color: widgetSettings?.secondary_color || "",
      position: widgetSettings?.position || "bottom-right",
      display_mode: widgetSettings?.display_mode || "floating",
    },
    mode: "onChange",
  });
  
  useEffect(() => {
    if (widgetSettings) {
      form.reset({
        agent_name: widgetSettings.agent_name || "",
        agent_description: widgetSettings.agent_description || "",
        welcome_text: widgetSettings.welcome_text || "",
        response_time_text: widgetSettings.response_time_text || "",
        chat_color: widgetSettings.chat_color || "",
        background_color: widgetSettings.background_color || "",
        text_color: widgetSettings.text_color || "",
        secondary_color: widgetSettings.secondary_color || "",
        position: widgetSettings.position || "bottom-right",
        display_mode: widgetSettings.display_mode || "floating",
      });
    }
  }, [widgetSettings, form]);

  useEffect(() => {
    if (error) {
      toast.error(`Error fetching widget settings: ${error.message}`);
    }
  }, [error]);

  if (!user) {
    return <div>Not authenticated.</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading widget settings...
      </div>
    );
  }

  if (!clientId) {
    return <div>Client ID is missing.</div>;
  }

  const handleLogoUpload = async (file: File) => {
    if (!clientId) return;
    
    setIsUploading(true);
    try {
      const result = await uploadLogo(file, clientId);
      if (result.url) {
        const updatedSettings = {
          ...widgetSettings,
          logo_url: result.url,
          logo_storage_path: result.storagePath || ""
        };
        
        await updateWidgetSettings(updatedSettings);
        await logClientActivity("logo_uploaded" as ActivityType, "Logo uploaded successfully", { logo_url: result.url });
        
        toast.success("Logo uploaded and settings updated");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveLogo = async () => {
    if (!clientId) return;
    
    setIsUploading(true);
    try {
      const updatedSettings = {
        ...widgetSettings,
        logo_url: "",
        logo_storage_path: ""
      };
      
      await updateWidgetSettings(updatedSettings);
      await logClientActivity("agent_logo_updated" as ActivityType, "Logo removed successfully");
      
      toast.success("Logo removed and settings updated");
    } catch (error) {
      console.error("Error removing logo:", error);
      toast.error("Failed to remove logo");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: WidgetSettingsFormValues) => {
    if (!clientId) return;

    try {
      const updatedSettings: WidgetSettingsType = {
        ...widgetSettings,
        agent_name: values.agent_name,
        agent_description: values.agent_description || "",
        welcome_text: values.welcome_text || "",
        response_time_text: values.response_time_text || "",
        chat_color: values.chat_color || "",
        background_color: values.background_color || "",
        text_color: values.text_color || "",
        secondary_color: values.secondary_color || "",
        position: values.position || "bottom-right",
        display_mode: values.display_mode || "floating",
      };

      await updateWidgetSettings(updatedSettings);
      await logClientActivity("widget_settings_updated" as ActivityType, "Widget settings updated");
      toast.success("Widget settings updated successfully!");
    } catch (error: any) {
      console.error("Error updating widget settings:", error);
      toast.error(`Failed to update widget settings: ${error.message}`);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Widget Settings</h1>
          <p className="text-muted-foreground">
            Customize the appearance and behavior of your widget.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how your widget looks and behaves.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="agent_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Name</FormLabel>
                        <FormControl>
                          <Input placeholder="AI Assistant" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is the name that will be displayed in the widget header.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="agent_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Your AI assistant" {...field} />
                        </FormControl>
                        <FormDescription>
                          A brief description of your AI assistant.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="welcome_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Welcome Text</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Hi there! How can I help you?" {...field} />
                        </FormControl>
                        <FormDescription>
                          The initial message displayed in the chat widget.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="response_time_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Response Time Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Usually responds within a few minutes" {...field} />
                        </FormControl>
                        <FormDescription>
                          The text displayed to indicate the typical response time.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="chat_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chat Color</FormLabel>
                        <FormControl>
                          <Input type="color" defaultValue="#854fff" {...field} />
                        </FormControl>
                        <FormDescription>
                          The main color of the chat widget.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="background_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background Color</FormLabel>
                        <FormControl>
                          <Input type="color" defaultValue="#ffffff" {...field} />
                        </FormControl>
                        <FormDescription>
                          The background color of the chat widget.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="text_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text Color</FormLabel>
                        <FormControl>
                          <Input type="color" defaultValue="#333333" {...field} />
                        </FormControl>
                        <FormDescription>
                          The color of the text in the chat widget.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="secondary_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Color</FormLabel>
                        <FormControl>
                          <Input type="color" defaultValue="#f0f0f0" {...field} />
                        </FormControl>
                        <FormDescription>
                          A secondary color for accents in the chat widget.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="position"
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
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The position of the chat widget on the screen.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="display_mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Mode</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a display mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="floating">Floating</SelectItem>
                            <SelectItem value="inline">Inline</SelectItem>
                            <SelectItem value="sidebar">Sidebar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The display mode of the chat widget.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit">Update Settings</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>
              Upload or remove your logo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LogoManagement
              logoUrl={localLogoPreview || widgetSettings?.logo_url || ""}
              isUploading={isUploading}
              onLogoUpload={handleLogoUpload}
              onRemoveLogo={handleRemoveLogo}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Widget Preview</h2>
        <Card>
          <CardContent>
            <WidgetPreview settings={widgetSettings} clientId={clientId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
