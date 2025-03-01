
import React from "react";
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
  queries: any[];
  isLoading: boolean;
}

export const QueryList: React.FC<QueryListProps> = ({ queries, isLoading }) => {
  return (
    <div>
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
    </div>
  );
};
