
import { useNewClientForm } from "@/hooks/useNewClientForm";
import { ClientFormData } from "@/types/client-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogoField } from "./form-fields/LogoField";

interface NewClientFormProps {
  onSubmit: (data: ClientFormData) => Promise<void>;
  initialData?: Partial<ClientFormData>;
  isSubmitting?: boolean;
}

export function NewClientForm({ onSubmit, initialData, isSubmitting: externalIsSubmitting }: NewClientFormProps) {
  const {
    form,
    errors,
    isSubmitting: internalIsSubmitting,
    handleSubmit,
    handleLogoChange,
  } = useNewClientForm({
    onSubmit,
    initialData: {
      widget_settings: {
        agent_name: "",
        agent_description: "",
        logo_url: "",
      },
      ...initialData
    },
  });

  const isSubmitting = externalIsSubmitting ?? internalIsSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">Client Name</Label>
            <Input
              id="client_name"
              {...form.register("client_name")}
              placeholder="Enter client name"
              disabled={isSubmitting}
              required
            />
            {errors.client_name && (
              <p className="text-sm text-red-500">{errors.client_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="Enter email address"
              disabled={isSubmitting}
              required
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chat Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent_name">Chat Name</Label>
            <Input
              id="agent_name"
              {...form.register("widget_settings.agent_name")}
              placeholder="Enter chat name"
              disabled={isSubmitting}
              defaultValue=""
            />
            {errors.widget_settings?.agent_name && (
              <p className="text-sm text-red-500">{errors.widget_settings.agent_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent_description">Chat Description</Label>
            <Textarea
              id="agent_description"
              {...form.register("widget_settings.agent_description")}
              placeholder="Describe your chat's purpose and personality"
              disabled={isSubmitting}
            />
            {errors.widget_settings?.agent_description && (
              <p className="text-sm text-red-500">{errors.widget_settings.agent_description}</p>
            )}
          </div>

          <Separator />

          <LogoField
            form={form}
            onLogoFileChange={handleLogoChange}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Client"}
        </Button>
      </div>
    </form>
  );
}
