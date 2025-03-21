
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';

export const QueryList = ({ queries, isLoading, error }) => {
  useEffect(() => {
    if (error) {
      toast.error("Failed to load common queries");
      console.error("Error loading common queries:", error);
    }
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Common Queries</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : queries && queries.length > 0 ? (
          <div className="space-y-2">
            {queries.map(query => (
              <div key={query.id || query.query_text} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between">
                  <div className="text-sm font-medium">{query.query_text}</div>
                  <div className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {query.frequency}×
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No common queries found
          </div>
        )}
      </CardContent>
    </Card>
  );
};
