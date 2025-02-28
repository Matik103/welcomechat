
import React from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";

interface ErrorLog {
  id: number;
  error_type: string;
  message: string;
  created_at: string;
}

interface ErrorLogListProps {
  logs: ErrorLog[] | undefined;
  isLoading: boolean;
}

export const ErrorLogList: React.FC<ErrorLogListProps> = ({ logs, isLoading }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">Error Logs</CardTitle>
          <CardDescription>Recent issues requiring attention</CardDescription>
        </div>
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : logs?.length ? (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{log.error_type}</p>
                    <p className="text-sm text-gray-600">{log.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(log.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">No errors recorded</p>
        )}
      </CardContent>
    </Card>
  );
};
