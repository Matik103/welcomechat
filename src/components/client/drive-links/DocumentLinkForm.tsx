
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  link: z.string().url('Please enter a valid URL'),
  refresh_rate: z.number().min(1).max(365).default(30),
});

export type DocumentLinkFormData = z.infer<typeof formSchema>;

export interface DocumentLinkFormProps {
  clientId: string;
  onSubmit: (data: DocumentLinkFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const DocumentLinkForm: React.FC<DocumentLinkFormProps> = ({
  clientId,
  onSubmit,
  isSubmitting = false,
}) => {
  const form = useForm<DocumentLinkFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      link: '',
      refresh_rate: 30,
    },
  });

  const handleSubmit = async (data: DocumentLinkFormData) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error('Error submitting document link:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Google Drive Link</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://drive.google.com/..."
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Enter a Google Drive document, spreadsheet, or folder link
              </FormDescription>
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
                  min={1}
                  max={365}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                How often should we check for changes? (1-365 days)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add Document Link'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default DocumentLinkForm;
