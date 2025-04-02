
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileX } from 'lucide-react';
import { DocumentUploadFormProps } from '@/types/document-processing';

export const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ 
  onSubmitDocument,
  isUploading
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      alert('File is too large. Maximum size is 20MB.');
      return;
    }
    
    setSelectedFile(file);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };
  
  const handleClearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSubmit = async () => {
    if (selectedFile) {
      await onSubmitDocument(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-md p-6 text-center ${
          dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="py-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded mr-3">
                  <Upload className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearSelection}
                disabled={isUploading}
              >
                <FileX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm font-medium">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, Word, Text files up to 20MB
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </div>
    </div>
  );
};
