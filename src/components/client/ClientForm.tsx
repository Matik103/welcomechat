
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Client } from "@/types/client";
import { useClientData } from "@/hooks/useClientData";

interface ClientFormProps {
  initialData?: Client | null;
  onSubmit: (data: { client_name: string; email: string; agent_name: string }) => Promise<void>;
  isLoading?: boolean;
  isClientView?: boolean;
}

const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  agent_name: z.string().min(1, "Agent name is required"),
});

export const ClientForm = ({ initialData, onSubmit, isLoading = false, isClientView = false }: ClientFormProps) => {
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  const { sendInvitation } = useClientData(initialData?.id);
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: initialData?.client_name || "",
      email: initialData?.email || "",
      agent_name: initialData?.agent_name || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue("client_name", initialData.client_name);
      setValue("email", initialData.email);
      setValue("agent_name", initialData.agent_name);
    }
  }, [initialData, setValue]);

  const handleSendInvitation = async () => {
    if (!initialData?.id) {
      toast.error("Client must be saved before sending an invitation");
      return;
    }

    try {
      setIsSendingInvitation(true);
      await sendInvitation(initialData.id, initialData.email, initialData.client_name);
    } catch (error) {
      // Error is already handled in the sendInvitation function
      console.error("Failed to send invitation:", error);
    } finally {
      setIsSendingInvitation(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="client_name" className="text-sm font-medium text-gray-900">
          Client Name
        </label>
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
        <label htmlFor="email" className="text-sm font-medium text-gray-900">
          Email Address
        </label>
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
        <label htmlFor="agent_name" className="text-sm font-medium text-gray-900">
          AI Agent Name
        </label>
        <Input
          id="agent_name"
          {...register("agent_name")}
          className={errors.agent_name ? "border-red-500" : ""}
        />
        {errors.agent_name && (
          <p className="text-sm text-red-500">{errors.agent_name.message}</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Client" : "Create Client"}
        </Button>
        
        {initialData?.id && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSendInvitation}
            disabled={isSendingInvitation}
          >
            {isSendingInvitation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Setup Link
          </Button>
        )}
      </div>
    </form>
  );
};
