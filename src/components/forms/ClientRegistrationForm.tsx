
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Form validation schema
const clientRegistrationSchema = z.object({
  client_name: z.string().min(2, "Client name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  description: z.string().optional(),
  bot_settings: z.object({
    bot_name: z.string().optional().default(""),
    bot_personality: z.string().optional(),
    bot_logo: z.any().optional(),
  }).default({
    bot_name: "",
    bot_personality: "",
    bot_logo: null,
  }),
});

type ClientRegistrationValues = z.infer<typeof clientRegistrationSchema>;

export interface ClientRegistrationFormProps {
  onSubmit: (data: ClientRegistrationValues) => Promise<void>;
  initialData?: Partial<ClientRegistrationValues>;
}

export function ClientRegistrationForm({ onSubmit, initialData }: ClientRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<ClientRegistrationValues>({
    resolver: zodResolver(clientRegistrationSchema),
    defaultValues: {
      client_name: initialData?.client_name || "",
      email: initialData?.email || "",
      company: initialData?.company || "",
      description: initialData?.description || "",
      bot_settings: {
        bot_name: initialData?.bot_settings?.bot_name || "",
        bot_personality: initialData?.bot_settings?.bot_personality || "",
        bot_logo: null,
      },
    },
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    if (file) {
      form.setValue("bot_settings.bot_logo", file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue("bot_settings.bot_logo", null);
      setLogoPreview(null);
    }
  };

  const handleSubmission = async (data: ClientRegistrationValues) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      form.reset();
      setLogoPreview(null);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmission)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">Client Name *</Label>
            <Input
              id="client_name"
              {...form.register("client_name")}
              placeholder="Enter client name"
              disabled={isLoading}
            />
            {form.formState.errors.client_name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.client_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="Enter email address"
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              {...form.register("company")}
              placeholder="Enter company name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Enter client description"
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chatbot Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot_name">Chatbot Name</Label>
            <Input
              id="bot_name"
              {...form.register("bot_settings.bot_name")}
              placeholder="Enter chatbot name"
              disabled={isLoading}
            />
            {form.formState.errors.bot_settings?.bot_name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.bot_settings.bot_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot_personality">Chatbot Personality</Label>
            <Textarea
              id="bot_personality"
              {...form.register("bot_settings.bot_personality")}
              placeholder="Describe your chatbot's personality"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot_logo">Chatbot Logo</Label>
            <div className="flex items-center gap-4">
              <Input
                id="bot_logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={isLoading}
                className="flex-1"
              />
              {logoPreview && (
                <div className="h-10 w-10 rounded overflow-hidden border border-gray-200">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="h-full w-full object-cover" 
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Client"}
        </Button>
      </div>
    </form>
  );
}
