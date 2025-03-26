
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { processExistingDocuments } from '@/utils/documentReprocessing';

interface ProcessExistingDocumentsProps {
  clients: { id: string; name: string; agent_name: string }[];
}

export const ProcessExistingDocuments: React.FC<ProcessExistingDocumentsProps> = ({ clients }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [processingStats, setProcessingStats] = useState<{
    processed: number;
    failed: number;
    total: number;
    progress: number;
  } | null>(null);

  const handleProcessDocuments = async () => {
    if (!selectedClient) {
      toast.error('Please select a client first');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStats(null);
      
      const client = clients.find(c => c.id === selectedClient);
      
      if (!client) {
        toast.error('Selected client not found');
        return;
      }
      
      toast.info(`Starting to process documents for ${client.name}...`, {
        duration: 3000,
      });
      
      const result = await processExistingDocuments(
        client.id,
        client.agent_name || 'AI Assistant'
      );
      
      if (result.success) {
        const total = result.processed + result.failed;
        setProcessingStats({
          processed: result.processed,
          failed: result.failed,
          total,
          progress: total > 0 ? Math.round((result.processed / total) * 100) : 0
        });
        
        if (result.processed === 0 && result.failed === 0) {
          toast.info('No documents found that need processing');
        } else if (result.failed === 0) {
          toast.success(`Successfully processed ${result.processed} documents`);
        } else if (result.processed === 0) {
          toast.error(`Failed to process ${result.failed} documents`);
        } else {
          toast.success(`Processed ${result.processed} documents with ${result.failed} failures`);
        }
      } else {
        toast.error('Failed to process documents');
      }
    } catch (error) {
      console.error('Error processing documents:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Existing Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="client-select" className="text-sm font-medium">
              Select Client
            </label>
            <Select
              value={selectedClient}
              onValueChange={setSelectedClient}
              disabled={isProcessing}
            >
              <SelectTrigger id="client-select">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {processingStats && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{processingStats.progress}%</span>
              </div>
              <Progress value={processingStats.progress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processed: {processingStats.processed}</span>
                <span>Failed: {processingStats.failed}</span>
                <span>Total: {processingStats.total}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleProcessDocuments}
            disabled={isProcessing || !selectedClient}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Process Documents with LlamaParse'
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground">
            This will find all unprocessed documents for the selected client and send them to LlamaParse for text extraction.
            The process may take several minutes depending on the number of documents.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
