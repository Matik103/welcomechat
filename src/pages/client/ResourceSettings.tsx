
// Import toast at the top of the file
import { toast } from "sonner";

// In the handleAddDocumentLink function, update the document_type conversion:
const handleAddDocumentLink = async (data: DocumentLinkFormData) => {
  setIsAddingDocument(true);
  try {
    // Convert string document_type to DocumentType
    const docType = data.document_type as DocumentType;
    
    await addDocumentLink({
      link: data.link,
      refresh_rate: data.refresh_rate,
      document_type: docType
    });
    toast.success('Document link added successfully');
    setOpenAddDocumentDialog(false);
  } catch (error) {
    console.error('Error adding document link:', error);
    toast.error('Failed to add document link');
  } finally {
    setIsAddingDocument(false);
  }
};
