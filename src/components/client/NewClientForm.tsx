
import { useState } from 'react';
import { useNewClientForm } from "@/hooks/useNewClientForm";
import { ClientFormData } from "@/types/client-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from 'sonner';

interface NewClientFormProps {
  onSubmit: (data: ClientFormData) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Partial<ClientFormData>;
}

export function NewClientForm({ onSubmit, isSubmitting = false, initialData }: NewClientFormProps) {
  const { form, handleSubmit, errors } = useNewClientForm({ 
    onSubmit: async (data) => {
      toast.loading("Creating client account and sending welcome email...");
      await onSubmit(data);
    }, 
    initialData 
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="client_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter client name" 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Enter email address" 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium">Assistant Settings</h3>
          
          <FormField
            control={form.control}
            name="widget_settings.agent_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assistant Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter assistant name" 
                    {...field} 
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="widget_settings.agent_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assistant Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter assistant description" 
                    {...field} 
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Client"}
      </Button>
    </form>
  );
}
