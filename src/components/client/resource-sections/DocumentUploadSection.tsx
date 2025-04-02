
import React, { useState } from 'react';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Upload, FileUp, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadSectionProps {
  clientId: string;
  logClientActivity: () => Promise<void>;
  onUploadComplete?: () => void;
}

export const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  clientId,
  logClientActivity,
  onUploadComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadDocument, isUploading, uploadProgress, uploadResult } = useDocumentUpload(clientId);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    try {
      console.log("Starting document upload process for:", selectedFile.name);
      await uploadDocument(selectedFile);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      await logClientActivity(); // Log the activity after successful upload
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      // Error is handled in the hook
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Upload</CardTitle>
        <CardDescription>
          Upload documents to be processed by your AI Assistant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            id="document-upload"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
            disabled={isUploading}
          />
          
          <label
            htmlFor="document-upload"
            className={`flex flex-col items-center justify-center cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FileUp className="h-10 w-10 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500 mb-1">
              {selectedFile ? selectedFile.name : 'Click to select a document'}
            </span>
            <span className="text-xs text-gray-400">
              PDF, DOC, DOCX, TXT, CSV, XLS, XLSX up to 10MB
            </span>
          </label>
        </div>
        
        {selectedFile && !isUploading && (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-2">
              <FileUp className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                {selectedFile.name}
              </span>
              <span className="text-xs text-gray-500">
                ({Math.round(selectedFile.size / 1024)} KB)
              </span>
            </div>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="text-white bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        )}
        
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadProgress < 90 ? 'Uploading document...' : 'Processing with LlamaIndex...'}
              </span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
            <p className="text-xs text-gray-500 mt-1">
              {uploadProgress < 50 ? 'Uploading your document...' : 'Your document is being processed with LlamaIndex. This may take a few moments...'}
            </p>
          </div>
        )}
        
        {uploadResult && uploadResult.success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Document processed successfully</AlertTitle>
            <AlertDescription className="text-green-700">
              Your document has been uploaded and processed with LlamaIndex. 
              {uploadResult.processed > 0 && (
                <span> Successfully processed {uploadResult.processed} sections.</span>
              )}
              {uploadResult.failed > 0 && (
                <span className="text-amber-600"> Failed to process {uploadResult.failed} sections.</span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {uploadResult && !uploadResult.success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload failed</AlertTitle>
            <AlertDescription>
              {uploadResult.error || 'There was an error processing your document with LlamaIndex. Please try again.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
