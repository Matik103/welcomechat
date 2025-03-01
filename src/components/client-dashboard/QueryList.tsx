
import React from "react";
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
import { Loader2, MessageSquare } from "lucide-react";

interface QueryListProps {
  queries: any[] | undefined;
  isLoading: boolean;
}

export const QueryList: React.FC<QueryListProps> = ({ queries, isLoading }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">Common User Queries</CardTitle>
          <CardDescription>Questions frequently asked by users</CardDescription>
        </div>
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : queries?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Query</TableHead>
                <TableHead className="w-[100px] text-right">Frequency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queries.map((query) => (
                <TableRow key={query.id}>
                  <TableCell className="font-medium">{query.query_text}</TableCell>
                  <TableCell className="text-right">{query.frequency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center py-4 text-gray-500">No common queries recorded yet</p>
        )}
      </CardContent>
    </Card>
  );
};
