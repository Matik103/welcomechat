
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ErrorLog } from "@/types/client-dashboard";

interface ErrorLogsCardProps {
  errorLogs: ErrorLog[] | undefined;
  isLoading?: boolean;
}

export const ErrorLogsCard = ({ errorLogs, isLoading = false }: ErrorLogsCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Recent Error Logs
          </CardTitle>
          <CardDescription>Issues requiring attention</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !errorLogs || errorLogs.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No errors recorded</p>
            <p className="text-xs text-gray-400 mt-1">Your AI agent is running smoothly</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {errorLogs.map((log) => (
              <div 
                key={log.id} 
                className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded-r-md shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{log.error_type}</p>
                    <p className="text-sm text-gray-600 mt-1">{log.message}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500">
                      {format(new Date(log.created_at), 'MMM d, yyyy')}
                    </span>
                    <span className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                      log.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status || 'pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
