
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
import { ChatInteraction } from "@/types/agent";

interface ChatHistoryCardProps {
  chatHistory?: ChatInteraction[];
}

export const ChatHistoryCard = ({ chatHistory }: ChatHistoryCardProps) => {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Chat History</CardTitle>
        <CardDescription>Recent conversations between end-users and the AI chatbot</CardDescription>
      </CardHeader>
      <CardContent>
        {chatHistory?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User Message</TableHead>
                <TableHead>AI Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chatHistory.map((chat) => (
                <TableRow key={chat.id}>
                  <TableCell>
                    {format(new Date(chat.timestamp), 'PP')}
                  </TableCell>
                  <TableCell>{chat.query}</TableCell>
                  <TableCell>{chat.response}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500 text-center py-4">No chat history available yet</p>
        )}
      </CardContent>
    </Card>
  );
};
