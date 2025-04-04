
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, File, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

interface UploadResult {
  success: boolean;
  error?: string;
  documentId?: string;
  publicUrl?: string;
}

interface DocumentUploadProps {
  clientId: string;
  onUploadComplete?: (result: UploadResult) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  clientId,
  onUploadComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
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
    
    setIsUploading(true);
    setUploadResult(null);
    setUploadProgress(10);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // Get the client's assistant
      const { data: assistant, error: assistantError } = await supabase
        .from('ai_agents')
        .select('openai_assistant_id')
        .eq('client_id', clientId)
        .single();

      if (assistantError) {
        console.error('Error getting assistant:', assistantError);
        throw new Error('Could not find an assistant for this client');
      }
      if (!assistant) {
        throw new Error('No assistant found for this client');
      }

      // Generate a unique file path using client ID and UUID
      const uniqueId = crypto.randomUUID();
      const filePath = `${clientId}/${uniqueId}/${selectedFile.name}`;
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error('Failed to upload file to storage');
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client_documents')
        .getPublicUrl(filePath);

      // Create document record in the document_content table
      const { data: document, error: docError } = await supabase
        .from('document_content')
        .insert({
          client_id: clientId,
          document_id: uniqueId,
          content: null, // Will be populated by the PDF extraction process
          filename: selectedFile.name,
          file_type: selectedFile.type,
          metadata: {
            size: selectedFile.size,
            storage_path: filePath,
            storage_url: publicUrl,
            uploadedAt: new Date().toISOString(),
            processing_status: selectedFile.type === 'application/pdf' ? 'pending_extraction' : 'ready'
          }
        })
        .select()
        .single();

      if (docError) {
        console.error('Error creating document record:', docError);
        // Try to clean up the uploaded file
        const { error: removeError } = await supabase.storage
          .from('client_documents')
          .remove([filePath]);
        if (removeError) {
          console.error('Failed to clean up file after document record error:', removeError);
        }
        throw new Error('Failed to create document record');
      }

      // Create record in assistant_documents table
      const { error: assistantDocError } = await supabase
        .from('assistant_documents')
        .insert({
          assistant_id: assistant.openai_assistant_id,
          client_id: clientId,
          filename: selectedFile.name,
          file_type: selectedFile.type,
          storage_path: filePath,
          metadata: {
            size: selectedFile.size,
            storage_url: publicUrl,
            uploadedAt: new Date().toISOString()
          },
          status: selectedFile.type === 'application/pdf' ? 'pending' : 'ready'
        });

      if (assistantDocError) {
        console.error('Error creating assistant document record:', assistantDocError);
        // Try to clean up the document record and file
        const { error: docDeleteError } = await supabase
          .from('document_content')
          .delete()
          .eq('id', document.id);
        if (docDeleteError) {
          console.error('Failed to clean up document record:', docDeleteError);
        }
        const { error: removeError } = await supabase.storage
          .from('client_documents')
          .remove([filePath]);
        if (removeError) {
          console.error('Failed to clean up file:', removeError);
        }
        throw new Error('Failed to create assistant document record');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // If it's a PDF, trigger the extraction process
      if (selectedFile.type === 'application/pdf') {
        try {
          const { data: extractionResponse, error: extractionError } = await supabase
            .functions.invoke('extract-pdf-content', {
              body: { document_id: document.id }
            });

          if (extractionError) {
            console.error('PDF extraction error:', extractionError);
            // Update document metadata to reflect extraction error
            const { error: updateError } = await supabase
              .from('document_content')
              .update({
                metadata: {
                  ...document.metadata,
                  processing_status: 'extraction_failed',
                  error: extractionError.message
                }
              })
              .eq('id', document.id);
            if (updateError) {
              console.error('Failed to update document metadata:', updateError);
            }
            // Update assistant_documents status
            const { error: assistantDocUpdateError } = await supabase
              .from('assistant_documents')
              .update({ status: 'failed' })
              .match({ assistant_id: assistant.openai_assistant_id, filename: selectedFile.name });
            if (assistantDocUpdateError) {
              console.error('Failed to update assistant document status:', assistantDocUpdateError);
            }
          }
        } catch (extractionError) {
          console.error('Failed to invoke PDF extraction:', extractionError);
          // Update document metadata to reflect extraction error
          const { error: updateError } = await supabase
            .from('document_content')
            .update({
              metadata: {
                ...document.metadata,
                processing_status: 'extraction_failed',
                error: extractionError instanceof Error ? extractionError.message : 'Unknown error'
              }
            })
            .eq('id', document.id);
          if (updateError) {
            console.error('Failed to update document metadata:', updateError);
          }
          // Update assistant_documents status
          const { error: assistantDocUpdateError } = await supabase
            .from('assistant_documents')
            .update({ status: 'failed' })
            .match({ assistant_id: assistant.openai_assistant_id, filename: selectedFile.name });
          if (assistantDocUpdateError) {
            console.error('Failed to update assistant document status:', assistantDocUpdateError);
          }
        }
      }

      const result: UploadResult = {
        success: true,
        documentId: document.id.toString(),
        publicUrl
      };
      
      setUploadResult(result);
      onUploadComplete?.(result);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadProgress(0);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      setUploadResult(errorResult);
      onUploadComplete?.(errorResult);
    } finally {
      setIsUploading(false);
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
    <>
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
            Supported formats: PDF, DOCX, TXT, CSV (Max 50MB)
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

          {isUploading && (
            <div className="mt-3 space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 text-right">{uploadProgress}%</p>
            </div>
          )}

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
        </div>
      )}
      
      {uploadResult && uploadResult.success && (
        <Alert className="bg-green-50 border-green-200 mt-4">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Document uploaded successfully</AlertTitle>
          <AlertDescription className="text-green-700">
            Your document has been uploaded successfully.
            {uploadResult.publicUrl && (
              <div className="mt-2">
                <a 
                  href={uploadResult.publicUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View document
                </a>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {uploadResult && !uploadResult.success && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload failed</AlertTitle>
          <AlertDescription>
            {uploadResult.error || 'There was an error uploading your document. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
