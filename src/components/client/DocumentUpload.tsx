
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, File, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { DocumentProcessingResult } from '@/types/document-processing';

interface DocumentUploadProps {
  uploadDocument: (file: File) => Promise<DocumentProcessingResult | null>;
  isUploading: boolean;
  uploadProgress: number;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  uploadDocument,
  isUploading,
  uploadProgress
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadResult, setUploadResult] = useState<DocumentProcessingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploadResult(null);
    try {
      const result = await uploadDocument(selectedFile);
      if (result) {
        setUploadResult(result);
        // Clear the selected file after successful upload
        if (result.success) {
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processed: 0,
        failed: 1
      });
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Upload a document to be processed and added to your AI agent's knowledge base.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">
              Drag and drop a file here, or{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm text-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </Button>
            </p>
            <p className="text-xs text-gray-500">
              Supported formats: PDF, DOCX, TXT, CSV (Max 20MB)
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.docx,.txt,.csv"
            />
          </div>
        </div>

        {selectedFile && (
          <div className="mt-4 border rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <File className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3">
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || !selectedFile}
                className="w-full"
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

            {isUploading && (
              <div className="mt-3">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center mt-1 text-gray-500">
                  {uploadProgress}% complete
                </p>
              </div>
            )}
          </div>
        )}

        {uploadResult && (
          <div className={`mt-4 p-3 rounded-md ${
            uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {uploadResult.success ? (
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  uploadResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {uploadResult.success ? 'Document uploaded successfully' : 'Upload failed'}
                </p>
                {uploadResult.error && (
                  <p className="text-sm text-red-600 mt-1">{uploadResult.error}</p>
                )}
                {uploadResult.success && (
                  <p className="text-sm text-green-700 mt-1">
                    {uploadResult.processed} pages processed successfully.
                    {uploadResult.failed > 0 && ` (${uploadResult.failed} pages failed)`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
