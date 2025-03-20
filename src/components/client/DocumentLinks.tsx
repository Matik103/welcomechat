
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentLinksProps {
  clientId: string;
  isClientView?: boolean;
}

export const DocumentLinks = ({ clientId, isClientView = false }: DocumentLinksProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [agentName, setAgentName] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      if (!clientId) return;
      
      setIsLoading(true);
      
      try {
        // Fetch agent name
        const { data: agentData, error: agentError } = await supabase
          .from("ai_agents")
          .select("name")
          .eq("id", clientId)
          .single();
          
        if (agentError) {
          console.error("Error fetching agent name:", agentError);
        } else if (agentData?.name) {
          setAgentName(agentData.name);
        }
        
        // Fetch documents
        const { data: docsData, error: docsError } = await supabase
          .from("client_documents")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false });
          
        if (docsError) {
          throw docsError;
        }
        
        setDocuments(docsData || []);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast.error("Failed to load documents");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [clientId]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }
  
  if (documents.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No documents found.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li key={doc.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
            <div>
              <h4 className="font-medium">{doc.file_name}</h4>
              <p className="text-sm text-gray-500">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>
            <a 
              href={doc.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              View
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
