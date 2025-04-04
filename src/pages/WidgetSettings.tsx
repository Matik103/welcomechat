
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useClientActivity } from '@/hooks/useClientActivity';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Upload } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ActivityType } from "@/types/activity";
import { getWidgetSettings, updateWidgetSettings } from '@/services/widgetSettingsService';

interface WidgetSettings {
  primaryColor: string;
  secondaryColor: string;
  borderRadius: number;
  fontFamily: string;
  greetingMessage: string;
  agentAvatar: string | null;
  companyLogo: string | null;
  showAgentAvailability: boolean;
}

const formSchema = z.object({
  primaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, { message: "Invalid hex code." }),
  secondaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, { message: "Invalid hex code." }),
  borderRadius: z.number().min(0).max(50),
  fontFamily: z.string().min(1),
  greetingMessage: z.string().min(1),
  showAgentAvailability: z.boolean().default(false),
});

export default function WidgetSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logClientActivity } = useClientActivity();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const clientId = user?.user_metadata?.client_id as string;

  // Use TanStack Query instead of Convex
  const { data: widgetSettings, isLoading } = useQuery({
    queryKey: ['widget-settings', clientId],
    queryFn: () => getWidgetSettings(clientId),
    enabled: !!clientId
  });

  const updateWidgetSettingsMutation = useMutation({
    mutationFn: async (settings: WidgetSettings) => {
      return updateWidgetSettings(clientId, settings);
    },
    onSuccess: () => {
      toast.success("Widget settings saved successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save widget settings");
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primaryColor: "#000000",
      secondaryColor: "#FFFFFF",
      borderRadius: 8,
      fontFamily: "Arial",
      greetingMessage: "How can I help you?",
      showAgentAvailability: false,
    },
  });

  useEffect(() => {
    if (widgetSettings) {
      form.reset({
        primaryColor: widgetSettings.primary_color || "#000000",
        secondaryColor: widgetSettings.secondary_color || "#FFFFFF",
        borderRadius: widgetSettings.borderRadius || 8,
        fontFamily: widgetSettings.font_family || "Arial",
        greetingMessage: widgetSettings.greeting_message || "How can I help you?",
        showAgentAvailability: widgetSettings.is_active || false,
      });
      setLogoUrl(widgetSettings.logo_url || null);
    }
  }, [widgetSettings, form]);

  const handleSaveWidgetSettings = async (settings: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      if (!clientId) {
        toast.error("Client ID not found. Please ensure you are logged in as a client.");
        return;
      }

      await updateWidgetSettingsMutation.mutateAsync({
        ...settings,
        agentAvatar: null,
        companyLogo: logoUrl
      });

      await logClientActivity(
        ActivityType.WIDGET_SETTINGS_UPDATED,
        "Widget settings updated",
        { settings_changed: Object.keys(settings) }
      );
    } catch (error: any) {
      console.error("Error saving widget settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    setIsUploading(true);
    const file = event.target.files[0];
    setFile(file);

    try {
      // Here we would typically upload the file to a storage service
      // Since we don't have useStorage hook anymore, we'll simulate it
      
      // Create a temporary URL for preview
      const tempUrl = URL.createObjectURL(file);
      setLogoUrl(tempUrl);

      toast.success("Logo preview updated. Save settings to upload.");
      
      await logClientActivity(
        ActivityType.LOGO_UPLOADED,
        "Widget logo uploaded",
        { file_name: file.name }
      );
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error(error.message || "Failed to upload logo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreviewClick = async () => {
    await logClientActivity(
      ActivityType.WIDGET_PREVIEWED,
      "Widget preview viewed"
    );
    window.open('/client/dashboard', '_blank');
  };

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading widget settings...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Widget Settings</CardTitle>
          <CardDescription>Customize the appearance and behavior of your chat widget.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveWidgetSettings)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="borderRadius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Border Radius</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fontFamily"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Font Family</FormLabel>
                      <FormControl>
                        <Input type="text" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="greetingMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Greeting Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="How can I help you?" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showAgentAvailability"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Show Agent Availability</FormLabel>
                      <CardDescription>Enable to display agent availability status.</CardDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Separator />

              <div>
                <FormLabel>Company Logo</FormLabel>
                <CardDescription>Upload your company logo to display on the widget.</CardDescription>
                <div className="mt-4 flex items-center space-x-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="h-12 w-auto rounded-md" />
                  ) : (
                    <Skeleton className="h-12 w-12 rounded-md" />
                  )}
                  <Button variant="outline" disabled={isUploading} asChild>
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      {isUploading ? (
                        <>
                          <Upload className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Upload Logo
                        </>
                      )}
                      <Input
                        id="logo-upload"
                        type="file"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  </Button>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => navigate('/client/dashboard')}>Cancel</Button>
                <div className="flex space-x-2">
                  <Button variant="secondary" onClick={handlePreviewClick}>Preview</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
