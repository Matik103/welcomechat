
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatDate } from '@/utils/stringUtils';
import { toast } from 'sonner';

export const ErrorLogList = ({ logs, isLoading, error = null }) => {
  useEffect(() => {
    if (error) {
      toast.error("Failed to load error logs");
      console.error("Error loading error logs:", error);
    }
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="bg-red-50 border border-red-100 rounded-lg p-3">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-red-800">{log.error_type || 'Error'}</div>
                  <div className="text-xs text-gray-500">{formatDate(log.created_at)}</div>
                </div>
                <div className="text-sm">{log.error_message || log.message}</div>
                {log.query_text && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Query:</span> {log.query_text}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No errors reported
          </div>
        )}
      </CardContent>
    </Card>
  );
};
