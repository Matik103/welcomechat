
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { Card, CardContent } from '@/components/ui/card';
import { createClientActivity } from '@/services/clientActivityService';

interface DocumentsTabProps {
  clientId: string;
  agentName: string;
  onSuccess: () => void;
}

export function DocumentsTab({ clientId, agentName, onSuccess }: DocumentsTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const { uploadDocument, isUploading } = useDocumentUpload(clientId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      await uploadDocument(file);
      
      // Log activity
      await createClientActivity(
        clientId,
        agentName,
        'document_added',
        `Document "${file.name}" uploaded for agent ${agentName}`,
        {
          document_name: file.name,
          document_size: file.size,
          document_type: file.type,
          agent_name: agentName
        }
      );
      
      toast.success('Document uploaded successfully');
      setFile(null);
      
      // Reset the file input
      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      onSuccess();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-upload">Upload Document</Label>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <input
                  id="document-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 cursor-pointer bg-muted/50" onClick={() => document.getElementById('document-upload')?.click()}>
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint or Text files</p>
                </div>
              </div>
              
              {file && (
                <div className="mt-2 text-sm">
                  <p>Selected file: <span className="font-medium">{file.name}</span></p>
                </div>
              )}
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        <p>Supported formats:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>PDF documents (.pdf)</li>
          <li>Microsoft Word documents (.doc, .docx)</li>
          <li>Text files (.txt)</li>
          <li>Microsoft PowerPoint (.ppt, .pptx)</li>
          <li>Microsoft Excel (.xls, .xlsx)</li>
        </ul>
      </div>
    </div>
  );
}
