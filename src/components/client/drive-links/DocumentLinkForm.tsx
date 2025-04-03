
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { validateDocumentLink } from '@/utils/documentProcessing';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '@/config/env';

const formSchema = z.object({
  link: z.string().url({ message: 'Please enter a valid URL' }),
  refresh_rate: z.number().min(1).max(1440),
  document_type: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface DocumentLinkFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
  agentName?: string;
}

export function DocumentLinkForm({ onSubmit, isSubmitting, agentName = 'AI Assistant' }: DocumentLinkFormProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [aiProcessingAvailable, setAiProcessingAvailable] = useState<boolean>(
    !!LLAMA_CLOUD_API_KEY && !!OPENAI_API_KEY
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      link: '',
      refresh_rate: 24,
      document_type: 'google_drive',
    },
  });

  const handleSubmit = async (data: FormData) => {
    // Validate the link
    const validation = validateDocumentLink(data.link);
    
    if (!validation.isValid) {
      setValidationError(validation.errors.join('. '));
      return;
    }
    
    setValidationError(null);
    
    try {
      await onSubmit({
        ...data,
        document_type: data.document_type || 'google_drive',
      });
      
      // Reset form
      form.reset({
        link: '',
        refresh_rate: 24,
        document_type: 'google_drive',
      });
    } catch (error) {
      console.error('Error submitting document link:', error);
      setValidationError(error instanceof Error ? error.message : 'Failed to add document link');
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
              <FormLabel>Document URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://docs.google.com/..." 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Enter a Google Drive link or direct document URL
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="document_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || 'google_drive'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="google_drive">Google Drive</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">Word Document</SelectItem>
                    <SelectItem value="url">Web URL</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="refresh_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Refresh Rate (hours)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    max="1440" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!aiProcessingAvailable && (
          <Alert variant="warning" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              LlamaIndex AI processing is not available. Document content extraction will be limited.
              Please configure LlamaIndex and OpenAI API keys for full functionality.
            </AlertDescription>
          </Alert>
        )}

        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
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
}
