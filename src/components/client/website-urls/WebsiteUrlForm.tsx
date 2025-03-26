
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { WebsiteUrlFormProps, WebsiteUrlFormData } from "@/types/website-url";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL").min(1, "URL is required"),
  refresh_rate: z.number().min(1, "Refresh rate is required").max(365, "Refresh rate cannot exceed 365 days")
});

export function WebsiteUrlForm({ onAdd, isAdding = false, agentName }: WebsiteUrlFormProps) {
  const form = useForm<WebsiteUrlFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      refresh_rate: 30 // 30 days default refresh rate
    }
  });

  const handleSubmit = async (data: WebsiteUrlFormData) => {
    if (onAdd) {
      await onAdd(data);
      form.reset();
    }
  };

  return (
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
                onChange={e => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isAdding}>
          {isAdding ? (
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
  );
}
