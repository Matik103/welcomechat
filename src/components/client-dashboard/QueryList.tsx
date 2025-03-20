
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
import { Loader2, MessageSquare } from "lucide-react";
import { QueryItem } from "@/types/client-dashboard";

interface QueryListProps {
  queries: QueryItem[] | undefined;
  isLoading: boolean;
}

export const QueryList: React.FC<QueryListProps> = ({ queries, isLoading }) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50 rounded-t-lg">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            Common User Queries
          </CardTitle>
          <CardDescription>Questions frequently asked by users</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : queries?.length ? (
          <div className="max-h-[350px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="w-[80px] text-right">Count</TableHead>
                  <TableHead className="w-[120px] text-right">Last Asked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queries.map((query) => (
                  <TableRow key={query.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{query.query_text}</TableCell>
                    <TableCell className="text-right">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {query.frequency}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-gray-500">
                      {query.last_asked ? 
                        format(new Date(query.last_asked), 'MMM d, yyyy') : 
                        format(new Date(query.created_at || new Date()), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No common queries recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">User interactions will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
