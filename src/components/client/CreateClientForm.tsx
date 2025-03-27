
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabaseAdmin } from "@/integrations/supabase/client-admin";

// Form validation schema
const clientFormSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  chatbotName: z.string().min(1, "Chatbot name is required"),
  chatbotDescription: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const CreateClientForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      clientName: "",
      email: "",
      chatbotName: "AI Assistant",
      chatbotDescription: "",
    },
  });

  const onSubmit = async (values: ClientFormValues) => {
    setIsSubmitting(true);
    try {
      // Create client in the ai_agents table
      const { data, error } = await supabaseAdmin.from("ai_agents").insert({
        client_name: values.clientName,
        email: values.email,
        name: values.chatbotName,
        agent_description: values.chatbotDescription,
        interaction_type: "config", // Set type as config
        settings: {
          agent_name: values.chatbotName,
          agent_description: values.chatbotDescription,
        },
        status: "active"
      }).select();

      if (error) {
        throw error;
      }

      toast.success("Client created successfully!");
      navigate("/admin/clients");
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(error.message || "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clientName" variant="blue">Client Name</Label>
        <Input
          id="clientName"
          {...form.register("clientName")}
          placeholder="Enter client name"
          className={form.formState.errors.clientName ? "border-red-500" : ""}
        />
        {form.formState.errors.clientName && (
          <p className="text-sm text-red-500">{form.formState.errors.clientName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" variant="blue">Email Address</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          placeholder="client@example.com"
          className={form.formState.errors.email ? "border-red-500" : ""}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="chatbotName" variant="blue">Chatbot Name</Label>
        <Input
          id="chatbotName"
          {...form.register("chatbotName")}
          placeholder="AI Assistant"
          className={form.formState.errors.chatbotName ? "border-red-500" : ""}
        />
        {form.formState.errors.chatbotName && (
          <p className="text-sm text-red-500">{form.formState.errors.chatbotName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="chatbotDescription" variant="blue">Chatbot Description</Label>
        <Textarea
          id="chatbotDescription"
          {...form.register("chatbotDescription")}
          placeholder="Describe what this chatbot does"
          className={form.formState.errors.chatbotDescription ? "border-red-500" : ""}
          rows={4}
        />
        {form.formState.errors.chatbotDescription && (
          <p className="text-sm text-red-500">{form.formState.errors.chatbotDescription.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Client"
          )}
        </Button>
      </div>
    </form>
  );
};

export default CreateClientForm;
