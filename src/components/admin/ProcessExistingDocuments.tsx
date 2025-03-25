
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import { DocumentProcessingService } from '@/services/documentProcessingService';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  agent_name: string;
}

interface ProcessExistingDocumentsProps {
  clients: Client[];
}

export function ProcessExistingDocuments({ clients }: ProcessExistingDocumentsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [pendingDocuments, setPendingDocuments] = useState<any[]>([]);
  const [processingComplete, setProcessingComplete] = useState(false);
  
  const handleFetchPendingDocuments = async () => {
    setIsProcessing(true);
    setProcessingStatus("Fetching pending documents...");
    try {
      const documents = await DocumentProcessingService.getPendingDocuments();
      setPendingDocuments(documents);
      setProcessingStatus(`Found ${documents.length} pending documents.`);
    } catch (error) {
      console.error("Error fetching pending documents:", error);
      toast.error("Failed to fetch pending documents");
      setProcessingStatus("Error fetching documents.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleProcessDocuments = async () => {
    if (pendingDocuments.length === 0) {
      toast.info("No pending documents to process");
      return;
    }
    
    setIsProcessing(true);
    setProcessingStatus("Processing documents...");
    
    let succeeded = 0;
    let failed = 0;
    
    for (let i = 0; i < pendingDocuments.length; i++) {
      const doc = pendingDocuments[i];
      setProcessingStatus(`Processing document ${i + 1} of ${pendingDocuments.length}...`);
      
      try {
        const result = await DocumentProcessingService.processDocument(doc.id);
        if (result) {
          succeeded++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error);
        failed++;
      }
    }
    
    setProcessingStatus(`Processing complete. ${succeeded} succeeded, ${failed} failed.`);
    setProcessingComplete(true);
    setIsProcessing(false);
    
    if (succeeded > 0) {
      toast.success(`Successfully processed ${succeeded} document(s)`);
    }
    
    if (failed > 0) {
      toast.error(`Failed to process ${failed} document(s)`);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Existing Documents</CardTitle>
        <CardDescription>
          Find and process documents that need extraction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={handleFetchPendingDocuments} 
              disabled={isProcessing}
              variant="outline"
            >
              {isProcessing && !processingComplete ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Find Pending Documents
            </Button>
            
            <Button 
              onClick={handleProcessDocuments} 
              disabled={isProcessing || pendingDocuments.length === 0}
              variant="default"
            >
              {isProcessing && processingComplete ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Process Documents ({pendingDocuments.length})
            </Button>
          </div>
          
          {processingStatus && (
            <div className="p-4 border rounded bg-gray-50">
              <p className="text-sm text-gray-700">{processingStatus}</p>
            </div>
          )}
          
          {pendingDocuments.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Pending Documents:</h3>
              <ul className="text-sm space-y-1">
                {pendingDocuments.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      {doc.status === 'pending' ? 'P' : 'N'}
                    </span>
                    <div>
                      <p>{doc.document_name || doc.name || 'Unnamed Document'}</p>
                      <p className="text-xs text-gray-500">
                        Status: {doc.status} | Client: {
                          clients.find(c => c.id === doc.client_id)?.name || 'Unknown Client'
                        }
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
