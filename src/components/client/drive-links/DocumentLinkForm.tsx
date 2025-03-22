
import React, { useState, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ValidationResult } from './ValidationResult';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentLinkFormProps } from '@/types/document-processing';

const formSchema = z.object({
  link: z.string().trim().min(1, { message: 'Link is required' }),
  document_type: z.string().min(1, { message: 'Document type is required' }),
  refresh_rate: z.number().int().positive().default(30),
});

export const DocumentLinkForm: React.FC<DocumentLinkFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting,
  agentName
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      link: '',
      document_type: 'google_drive',
      refresh_rate: 30,
    },
  });

  const { watch, setValue } = form;
  const watchedLink = watch('link');
  const watchedDocumentType = watch('document_type');

  // Auto-detect document type based on URL
  useEffect(() => {
    if (!watchedLink) return;
    try {
      const url = new URL(watchedLink);
      
      if (url.hostname.includes('docs.google.com')) {
        if (url.pathname.includes('/document/')) {
          setValue('document_type', 'google_doc');
        } else if (url.pathname.includes('/spreadsheets/')) {
          setValue('document_type', 'google_sheet');
        }
      } else if (url.hostname.includes('drive.google.com')) {
        setValue('document_type', 'google_drive');
      } else if (watchedLink.toLowerCase().endsWith('.pdf')) {
        setValue('document_type', 'pdf');
      } else if (
        watchedLink.toLowerCase().endsWith('.txt') || 
        watchedLink.toLowerCase().endsWith('.md')
      ) {
        setValue('document_type', 'text');
      }
    } catch (error) {
      // Not a valid URL, don't change anything
    }
  }, [watchedLink, setValue]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="document_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="google_drive">Google Drive</SelectItem>
                  <SelectItem value="google_doc">Google Doc</SelectItem>
                  <SelectItem value="google_sheet">Google Sheet</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="text">Text Document</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Link</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://drive.google.com/drive/folders/..."
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <ValidationResult link={field.value} type={watchedDocumentType} />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <Button 
              variant="outline" 
              onClick={onCancel} 
              type="button"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>Add Link</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
