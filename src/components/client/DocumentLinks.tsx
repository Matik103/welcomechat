import React from 'react';
import { useUnifiedDocumentUpload } from '@/hooks/useUnifiedDocumentUpload';
import { toast } from 'sonner';

interface DocumentLinksProps {
  clientId: string;
}

export function DocumentLinks({ clientId }: { clientId: string }) {
  const { uploadDocument, isUploading } = useUnifiedDocumentUpload(clientId);

  const handleUpload = (formData: FormData) => {
    uploadDocument(formData);
  };

  const handleSuccess = () => {
    toast.success("Document uploaded successfully!");
  };

  const handleError = (error: any) => {
    toast.error(`Failed to upload document: ${error.message}`);
  };

  return (
    <div>
      {/* Your component's UI elements for displaying document links */}
      {/* Example: */}
      <p>Document Links Component for Client: {clientId}</p>
      <form onSubmit={(e) => {
        e.preventDefault();
        const fileInput = document.getElementById('document') as HTMLInputElement;
        if (fileInput && fileInput.files && fileInput.files[0]) {
          const formData = new FormData();
          formData.append('file', fileInput.files[0]);
          handleUpload(formData);
        }
      }}>
        <input type="file" id="document" />
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
    </div>
  );
}
