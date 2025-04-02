
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { toast } from 'sonner';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';

interface DocumentsTabProps {
  clientId: string;
  agentName: string;
  onSuccess: () => void;
}

export function DocumentsTab({ clientId, agentName, onSuccess }: DocumentsTabProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const { uploadDocument, isUploading } = useDocumentUpload(clientId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files || files.length === 0) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      // Upload each selected file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Only pass the file parameter
        await uploadDocument(file);
        
        // Create client activity with correct parameter order and using enum type
        await createClientActivity(
          clientId,
          agentName,
          ActivityType.DOCUMENT_ADDED,  // Using enum instead of string description
          `Document uploaded for agent ${agentName}: ${file.name}`,
          {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            agent_name: agentName
          }
        );
      }
      
      toast.success(`${files.length > 1 ? 'Documents' : 'Document'} uploaded successfully`);
      setFiles(null);
      
      // Reset the file input
      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-dashed">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-upload">Upload Documents</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your files here, or click to select files
              </p>
              <input
                id="document-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.ppt,.pptx"
                multiple
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('document-upload')?.click()}
              >
                Select Files
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: PDF, Word, TXT, Markdown, CSV, Excel, PowerPoint
              </p>
            </div>
            {files && files.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Selected files:</p>
                <ul className="text-xs text-gray-600 list-disc pl-5 mt-1">
                  {Array.from(files).map((file, index) => (
                    <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={isUploading || !files || files.length === 0}
            className="w-full"
          >
            {isUploading ? 'Uploading...' : 'Upload Documents'}
          </Button>
        </form>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        <p>Basic document upload is available, but advanced document processing is being rebuilt.</p>
        <p className="mt-2">Your files will be stored but advanced extraction features will be available in a future update.</p>
      </div>
    </div>
  );
}
