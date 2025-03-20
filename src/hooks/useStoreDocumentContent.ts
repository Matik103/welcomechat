import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClient } from "./useClient";

interface Document {
  id: string | number;
  name: string;
  type: string;
  size: number;
  url: any;
  uploadDate: any;
  status: "processing" | "completed" | "failed";
}

export function useStoreDocumentContent(clientId: string | undefined) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { client } = useClient(clientId);

  // Fetch documents from the database
  const {
    data: dbDocuments,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["documents", clientId],
    queryFn: async () => {
      if (!clientId) return null;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("ai_agents")
          .select("name, settings, url, created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching documents:", error);
          setError(error);
          toast.error("Failed to load documents");
          return null;
        }

        if (!data) {
          console.warn("No documents found for client:", clientId);
          return [];
        }

        // Transform the data into the Document interface
        const documentList = data.map((document) => {
          const settings = document.settings as any;
          const documentJson = {
            id: String(document.id), // Convert to string here
            name: document.name,
            type: document.type,
            size: document.size,
            url: document.url,
            uploadDate: document.uploadDate,
            status: document.status
          };
          return documentJson;
        });

        return documentList;
      } catch (err: any) {
        console.error("Unexpected error fetching documents:", err);
        setError(err);
        toast.error("Failed to load documents due to an unexpected error");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!clientId,
  });

  useEffect(() => {
    if (dbDocuments) {
      setDocuments(dbDocuments);
    }
  }, [dbDocuments]);

  useEffect(() => {
    if (queryError) {
      setError(queryError);
      toast.error("Failed to load documents");
    }
  }, [queryError]);

  const addDocument = (newDocument: Document) => {
    setDocuments((prevDocuments) => [...prevDocuments, newDocument]);
  };

  const updateDocument = (updatedDocument: Document) => {
    setDocuments((prevDocuments) =>
      prevDocuments.map((doc) =>
        doc.id === updatedDocument.id ? updatedDocument : doc
      )
    );
  };

  const deleteDocument = async (documentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("ai_agents")
        .delete()
        .eq("id", documentId);

      if (error) {
        console.error("Error deleting document:", error);
        setError(error);
        toast.error("Failed to delete document");
      } else {
        setDocuments((prevDocuments) =>
          prevDocuments.filter((doc) => doc.id !== documentId)
        );
        toast.success("Document deleted successfully");
      }
    } catch (err: any) {
      console.error("Unexpected error deleting document:", err);
      setError(err);
      toast.error("Failed to delete document due to an unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    documents,
    isLoading: isLoading || isQueryLoading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    refetch,
  };
}
