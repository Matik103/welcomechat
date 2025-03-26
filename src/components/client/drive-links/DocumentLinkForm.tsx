
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentLinkFormData } from '@/types/document-processing';

const documentLinkFormSchema = z.object({
  link: z.string().url('Please enter a valid Google Drive URL'),
  refresh_rate: z.coerce.number().int().positive('Please select a refresh rate'),
});

export interface DocumentLinkFormProps {
  onSubmit: (data: DocumentLinkFormData) => Promise<void>;
  isSubmitting: boolean;
  agentName?: string;
}

export const DocumentLinkForm: React.FC<DocumentLinkFormProps> = ({ 
  onSubmit, 
  isSubmitting,
  agentName = "AI Assistant"
}) => {
  const form = useForm<DocumentLinkFormData>({
    resolver: zodResolver(documentLinkFormSchema),
    defaultValues: {
      link: '',
      refresh_rate: 24,
    },
  });

  const handleSubmit = async (data: DocumentLinkFormData) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error('Error submitting form:', error);
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
                  placeholder="https://drive.google.com/file/d/..." 
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
          name="refresh_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Refresh Rate</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value.toString()}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select refresh rate" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="6">Every 6 hours</SelectItem>
                  <SelectItem value="12">Every 12 hours</SelectItem>
                  <SelectItem value="24">Every 24 hours</SelectItem>
                  <SelectItem value="72">Every 3 days</SelectItem>
                  <SelectItem value="168">Every week</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Adding...' : `Add Document to ${agentName}`}
        </Button>
      </form>
    </Form>
  );
};
