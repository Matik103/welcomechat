
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fixDocumentContentRLS } from '@/utils/applyDocumentContentRLS';
import { Json } from '@/types/document-processing';

interface UploadResult {
  success: boolean;
  error?: string;
  documentId?: string;
  publicUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface DocumentUploadProps {
  clientId: string;
  onUploadComplete?: (result: UploadResult) => void;
}

// Type-safe metadata interface
interface DocumentMetadata {
  size: number;
  storage_path: string;
  storage_url: string;
  uploadedAt: string;
  processing_status?: string;
  error?: string;
  [key: string]: any;
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
  const [isFixingPermissions, setIsFixingPermissions] = useState(false);
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
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFixPermissions = async () => {
    setIsFixingPermissions(true);
    try {
      const result = await fixDocumentContentRLS();
      
      if (result.success) {
        setUploadResult({
          success: false,
          error: "Permissions fixed. Please try uploading again."
        });
      } else {
        setUploadResult({
          success: false,
          error: `Failed to fix permissions: ${result.message}`
        });
      }
    } catch (error) {
      console.error("Error fixing permissions:", error);
      setUploadResult({
        success: false,
        error: `Error fixing permissions: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsFixingPermissions(false);
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

      // Generate a unique file path using client ID and UUID
      const uniqueId = crypto.randomUUID();
      const filePath = `${clientId}/${uniqueId}/${selectedFile.name}`;
      
      console.log(`Starting document upload for client ${clientId}:`, {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        filePath
      });
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client_documents')
        .getPublicUrl(filePath);

      console.log('File uploaded successfully, public URL:', publicUrl);

      // Get the client's assistant
      const { data: assistant, error: assistantError } = await supabase
        .from('ai_agents')
        .select('id, openai_assistant_id')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .single();

      if (assistantError) {
        console.log('No assistant found - continuing without assistant association');
      }

      // Create document metadata
      const documentMetadata: DocumentMetadata = {
        size: selectedFile.size,
        storage_path: filePath,
        storage_url: publicUrl,
        uploadedAt: new Date().toISOString(),
        processing_status: selectedFile.type === 'application/pdf' ? 'pending_extraction' : 'ready'
      };

      // Create document record in document_content table
      const { data: document, error: docError } = await supabase
        .from('document_content')
        .insert({
          client_id: clientId,
          document_id: uniqueId,
          content: null,
          filename: selectedFile.name,
          file_type: selectedFile.type,
          metadata: documentMetadata as Json
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
        
        if (docError.message.includes('row-level security policy') || 
            docError.message.includes('permission denied')) {
          throw new Error('Permission denied. Please try the "Fix Permissions" button below.');
        }
        
        throw new Error(`Failed to create document record: ${docError.message}`);
      }

      console.log('Document record created:', document);

      // Create record in assistant_documents table if we found an assistant
      if (assistant && assistant.openai_assistant_id) {
        try {
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
              }
            });

          if (assistantDocError) {
            console.error('Error creating assistant document record:', assistantDocError);
            // We'll continue anyway since the main document was created successfully
          }
        } catch (error) {
          console.warn('Error linking document to assistant (non-critical):', error);
          // Non-critical error, continue
        }
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
            // This is non-fatal, so we'll continue
          }
        } catch (extractionError) {
          console.error('Failed to invoke PDF extraction:', extractionError);
          // This is also non-fatal
        }
      }

      const result: UploadResult = {
        success: true,
        documentId: document.id.toString(),
        publicUrl,
        fileName: selectedFile.name,
        fileType: selectedFile.type
      };
      
      setUploadResult(result);
      if (onUploadComplete) onUploadComplete(result);
      
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      return result;
    } catch (error) {
      console.error('Error uploading document:', error);
      
      setUploadProgress(0);
      
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fileName: selectedFile.name,
        fileType: selectedFile.type
      };
      
      setUploadResult(errorResult);
      if (onUploadComplete) onUploadComplete(errorResult);
      
      return null;
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
            
            {uploadResult.error && (
              uploadResult.error.includes('row-level security policy') || 
              uploadResult.error.includes('permission denied') || 
              uploadResult.error.includes('Fix Permissions')
            ) && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleFixPermissions}
                  disabled={isFixingPermissions}
                >
                  {isFixingPermissions ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fixing permissions...
                    </>
                  ) : (
                    'Fix Permissions'
                  )}
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
