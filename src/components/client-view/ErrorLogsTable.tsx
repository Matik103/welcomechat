
import React from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  created_at: string;
  client_id: string;
  status: string;
}

interface ErrorLogsTableProps {
  errorLogs: ErrorLog[] | undefined;
}

export const ErrorLogsTable: React.FC<ErrorLogsTableProps> = ({ errorLogs }) => {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Chatbot Issues</CardTitle>
        <CardDescription>Errors encountered during end-user conversations</CardDescription>
      </CardHeader>
      <CardContent>
        {errorLogs?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Error Type</TableHead>
                <TableHead>Error Details</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.created_at!), 'PP')}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{log.error_type}</span>
                  </TableCell>
                  <TableCell>{log.message}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.status || "pending"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500 text-center py-4">No chatbot issues reported</p>
        )}
      </CardContent>
    </Card>
  );
};
