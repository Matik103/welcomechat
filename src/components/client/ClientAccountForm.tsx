
// Import necessary components and hooks
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { generateTempPassword, saveClientTempPassword } from "@/utils/clientCreationUtils";
import { toast } from "sonner";

const formSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  agent_name: z.string().min(1, "Agent name is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ClientAccountFormProps {
  initialData?: {
    id?: string;
    client_name?: string;
    email?: string;
    agent_name?: string;
  };
  onSubmit: (data: FormValues & { tempPassword?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function ClientAccountForm({
  initialData,
  onSubmit,
  isLoading = false,
}: ClientAccountFormProps) {
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState<string>("");
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_name: initialData?.client_name || "",
      email: initialData?.email || "",
      agent_name: initialData?.agent_name || "",
    },
  });

  const handleGeneratePassword = async () => {
    if (!initialData?.id) return;
    
    try {
      setIsGeneratingPassword(true);
      // Make sure generateTempPassword returns a string
      const generatedPassword: string = generateTempPassword();
      setTempPassword(generatedPassword);
      
      await saveClientTempPassword(
        initialData.id,
        watch("email"),
        generatedPassword
      );
      
      toast.success("Generated temporary password");
    } catch (error) {
      console.error("Error generating password:", error);
      toast.error("Failed to generate password");
    } finally {
      setIsGeneratingPassword(false);
    }
  };

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({
      ...data,
      tempPassword: tempPassword || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="client_name" className="text-sm font-medium text-gray-900">
          Client Name
        </Label>
        <Input
          id="client_name"
          {...register("client_name")}
          className={errors.client_name ? "border-red-500" : ""}
        />
        {errors.client_name && (
          <p className="text-sm text-red-500">{errors.client_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-900">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent_name" className="text-sm font-medium text-gray-900">
          AI Agent Name
        </Label>
        <Input
          id="agent_name"
          {...register("agent_name")}
          className={errors.agent_name ? "border-red-500" : ""}
        />
        {errors.agent_name && (
          <p className="text-sm text-red-500">{errors.agent_name.message}</p>
        )}
      </div>

      {initialData?.id && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGeneratePassword}
            disabled={isGeneratingPassword}
          >
            {isGeneratingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Temporary Password
          </Button>
          {tempPassword && (
            <p className="text-sm text-green-600">
              Temporary password generated: <code>{tempPassword}</code>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
