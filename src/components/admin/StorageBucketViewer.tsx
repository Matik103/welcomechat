
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClient } from "@/hooks/useClient";

interface StorageItem {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: any;
  bucketId: string;
  owner?: string;
  clientId?: string;
  clientName?: string;
}

export function StorageBucketViewer() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<StorageItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Map<string, string>>(new Map());
  
  const fetchStorageItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First get list of clients for lookup
      const { data: clientData, error: clientError } = await supabase
        .from('ai_agents')
        .select('id, client_id, name, client_name')
        .eq('interaction_type', 'config');
      
      if (clientError) {
        console.error("Error fetching clients:", clientError);
        setError(`Error fetching clients: ${clientError.message}`);
        return;
      }
      
      // Create a lookup map from client ID to name
      const clientMap = new Map<string, string>();
      if (clientData) {
        clientData.forEach(agent => {
          if (agent.client_id) {
            clientMap.set(agent.client_id, agent.client_name || agent.name || 'Unnamed Client');
          }
        });
      }
      setClients(clientMap);
      
      // Now fetch the storage items from "Document Storage" bucket
      const { data, error: storageError } = await supabase
        .storage
        .from('Document Storage')
        .list();
      
      if (storageError) {
        console.error("Error listing storage items:", storageError);
        setError(`Error listing storage: ${storageError.message}`);
        return;
      }
      
      if (!data) {
        setItems([]);
        return;
      }
      
      // Process the items to extract client information
      const processedItems: StorageItem[] = data.map(item => {
        // Try to extract client ID from file path
        let clientId: string | undefined;
        let clientName: string | undefined;
        
        // Check if file path contains a client ID
        if (item.name && item.name.includes('/')) {
          const parts = item.name.split('/');
          if (parts.length > 0) {
            const potentialClientId = parts[0];
            if (clientMap.has(potentialClientId)) {
              clientId = potentialClientId;
              clientName = clientMap.get(potentialClientId);
            }
          }
        }
        
        return {
          ...item,
          bucketId: 'Document Storage',
          clientId,
          clientName
        };
      });
      
      setItems(processedItems);
    } catch (err) {
      console.error("Error in fetchStorageItems:", err);
      setError(`Unexpected error: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStorageItems();
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Document Storage Bucket Contents
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStorageItems}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Refresh'}
          </Button>
        </CardTitle>
        <CardDescription>
          Files stored in the "Document Storage" bucket
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-md">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No files found in the Document Storage bucket
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 font-semibold border-b pb-2">
              <div>File Name</div>
              <div>Client</div>
              <div>Last Modified</div>
            </div>
            {items.map((item) => (
              <div key={item.id || item.name} className="grid grid-cols-3 border-b border-gray-100 pb-2">
                <div className="break-all">
                  {item.name}
                  {!item.id && item.name.endsWith('/') && (
                    <Badge variant="outline" className="ml-2">Folder</Badge>
                  )}
                </div>
                <div>
                  {item.clientName ? (
                    <Badge variant="secondary">{item.clientName}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Unknown</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
