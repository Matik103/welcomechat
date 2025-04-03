import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { validateDocumentLink } from '@/utils/documentProcessing';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  link: z.string()
    .url({ message: 'Please enter a valid URL' })
    .refine(
      (url) => url.includes('docs.google.com') || url.includes('drive.google.com'),
      { message: 'Please enter a valid Google Drive, Docs, Sheets, or Slides URL' }
    ),
  refresh_rate: z.number().min(1).max(1440),
});

type FormData = z.infer<typeof formSchema> & {
  document_type?: string;
};

interface DocumentLinkFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
  agentName?: string;
}

export function DocumentLinkForm({ onSubmit, isSubmitting, agentName = 'AI Assistant' }: DocumentLinkFormProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [aiProcessingAvailable, setAiProcessingAvailable] = useState<boolean>(true);

  useEffect(() => {
    const checkAiProcessingAvailable = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-secrets', {
          body: {
            keys: ['OPENAI_API_KEY']
          }
        });
        
        setAiProcessingAvailable(!!data?.OPENAI_API_KEY);
      } catch (err) {
        console.error('Error checking AI processing availability:', err);
        setAiProcessingAvailable(false);
      }
    };

    checkAiProcessingAvailable();
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      link: '',
      refresh_rate: 24,
    },
  });

  const handleSubmit = async (data: FormData) => {
    const validation = validateDocumentLink(data.link);
    
    if (!validation.isValid) {
      setValidationError(validation.errors.join('. '));
      return;
    }
    
    setValidationError(null);
    
    try {
      await onSubmit({
        ...data,
        document_type: 'google_drive',
      });
      
      form.reset({
        link: '',
        refresh_rate: 24,
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
                Add document links from Google Drive, Sheets, or other sources
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
              <FormLabel>Refresh Rate (hours)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min={1}
                  max={1440}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                How often should we check for updates to this document?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {!aiProcessingAvailable && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              AI processing is currently unavailable. Documents will be stored but not processed by {agentName}.
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Document...
            </>
          ) : (
            'Add Document Link'
          )}
        </Button>
      </form>
    </Form>
  );
}
