
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ValidationResult } from './ValidationResult';
import { Loader2 } from 'lucide-react';
import { useDriveAccessCheck } from '@/hooks/useDriveAccessCheck';
import { AccessStatus } from '@/types/client';

// Schema for form validation
const documentLinkSchema = z.object({
  link: z.string().url("Please enter a valid URL"),
  refresh_rate: z.coerce.number().int().min(1, "Refresh rate must be at least 1 day").default(7),
  document_type: z.enum(["google_doc", "google_sheet", "google_drive", "pdf", "text", "other"]).default("google_doc"),
});

interface DocumentLinkFormProps {
  onSubmit: (data: z.infer<typeof documentLinkSchema>) => Promise<void>;
  isSubmitting: boolean;
  agentName: string;
}

export const DocumentLinkForm = ({ onSubmit, isSubmitting, agentName }: DocumentLinkFormProps) => {
  const { accessStatus, isLoading, error, refreshStatus } = useDriveAccessCheck(0);
  
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<z.infer<typeof documentLinkSchema>>({
    resolver: zodResolver(documentLinkSchema),
    defaultValues: {
      refresh_rate: 7,
      document_type: "google_doc"
    }
  });

  const link = watch('link');

  const handleFormSubmit = async (data: z.infer<typeof documentLinkSchema>) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mb-6">
      <div>
        <Label htmlFor="link">Document URL</Label>
        <Input
          id="link"
          placeholder="https://drive.google.com/file/d/..."
          {...register("link")}
          className={errors.link ? "border-red-500" : ""}
        />
        {errors.link && <p className="text-red-500 text-sm mt-1">{errors.link.message}</p>}
        {link && <ValidationResult link={link} type="google-drive" />}
      </div>

      <div>
        <Label htmlFor="document_type">Document Type</Label>
        <Select defaultValue="google_doc" {...register("document_type")}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="google_doc">Google Document</SelectItem>
            <SelectItem value="google_sheet">Google Spreadsheet</SelectItem>
            <SelectItem value="google_drive">Google Drive Folder</SelectItem>
            <SelectItem value="pdf">PDF Document</SelectItem>
            <SelectItem value="text">Text Document</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="refresh_rate">Refresh Rate (days)</Label>
        <Input
          id="refresh_rate"
          type="number"
          min="1"
          {...register("refresh_rate")}
          className={errors.refresh_rate ? "border-red-500" : ""}
        />
        {errors.refresh_rate && <p className="text-red-500 text-sm mt-1">{errors.refresh_rate.message}</p>}
        <p className="text-sm text-muted-foreground mt-1">
          {agentName} will refresh content from this document every {watch("refresh_rate") || 7} days.
        </p>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Adding..." : "Add Document Link"}
        </Button>
      </div>
    </form>
  );
};
