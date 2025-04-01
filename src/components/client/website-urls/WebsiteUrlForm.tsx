
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { WebsiteUrlFormProps, WebsiteUrlFormData, WebsiteUrlMetadata } from "@/types/website-url";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL").min(1, "URL is required"),
  refresh_rate: z.number().min(1, "Refresh rate is required").max(365, "Refresh rate cannot exceed 365 days")
});

export function WebsiteUrlForm({ onAdd, onSubmit, isAdding = false, isSubmitting = false, agentName, clientId }: WebsiteUrlFormProps) {
  const form = useForm<WebsiteUrlFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      refresh_rate: 30 // 30 days default refresh rate
    }
  });

  const handleSubmit = async (data: WebsiteUrlFormData) => {
    try {
      // Use onSubmit if provided, otherwise fall back to onAdd
      const submitFunction = onSubmit || onAdd;
      if (!submitFunction) {
        console.error("No submit function provided");
        return;
      }
      
      console.log("Submitting website URL:", data);
      
      // Prepare metadata if agentName is provided
      if (agentName && !data.metadata) {
        data.metadata = {
          agent_name: agentName,
          source: 'user_form',
          added_at: new Date().toISOString(),
          last_interaction: null,
          ai_notes: '',
          tags: [],
          status_history: [{
            status: 'added',
            timestamp: new Date().toISOString()
          }]
        };
      }
      
      // Prevent default navigation
      await submitFunction(data);
      form.reset();
    } catch (error) {
      console.error("Error submitting website URL:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="refresh_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Refresh Rate (days)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max="365" 
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value) || 30)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isAdding || isSubmitting}>
            {(isAdding || isSubmitting) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Website'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
