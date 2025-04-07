
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { getAnswerFromOpenAIAssistant } from '@/utils/openAIDocumentSync';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantPreviewProps {
  clientId: string;
  assistantId: string;
}

export function AssistantPreview({ clientId, assistantId }: AssistantPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Clear error when input changes
  useEffect(() => {
    if (input && error) {
      setError(null);
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Sending message to assistant (${clientId}): ${userMessage}`);
      
      // Add debug info to help track network issues
      console.log(`AssistantPreview request details: timestamp=${new Date().toISOString()}, clientId=${clientId}, assistantId=${assistantId}`);
      
      // Make the request with timeout handling
      const fetchTimeout = setTimeout(() => {
        setError('Request timed out. The server might be temporarily unavailable.');
        setIsLoading(false);
        
        // Add assistant response indicating the timeout
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm sorry, but the request timed out. Please try again in a few moments." 
        }]);
        
        setConnectionAttempts(prev => prev + 1);
      }, 15000); // 15 seconds timeout
      
      // Use the improved error handling approach
      const result = await getAnswerFromOpenAIAssistant(clientId, userMessage);
      clearTimeout(fetchTimeout);
      
      if (result.error) {
        console.error('Assistant query error:', result.error);
        setError(`Error: ${result.error}`);
        
        // Give more specific messages based on the error
        let errorMessage = "I'm sorry, I couldn't process that request due to a technical issue.";
        
        if (result.error.includes("send a request to the Edge Function")) {
          errorMessage = "I'm currently having trouble connecting to my knowledge base. This might be due to a temporary network issue. Please try again shortly.";
          setConnectionAttempts(prev => prev + 1);
        }
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: errorMessage
        }]);
      } else {
        // Reset connection attempts on success
        if (connectionAttempts > 0) {
          setConnectionAttempts(0);
        }
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: result.answer || "I'm sorry, I couldn't process that request." 
        }]);
      }
    } catch (error) {
      console.error('Error querying assistant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      let userFriendlyMessage = "Sorry, I encountered an error processing your request. Please try again later.";
      
      // Give more specific error messages for common issues
      if (errorMessage.includes("network") || errorMessage.includes("Failed to fetch")) {
        userFriendlyMessage = "I'm having trouble connecting to my knowledge base right now. This might be due to network connectivity issues. Please try again in a few moments.";
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: userFriendlyMessage
      }]);
      
      setConnectionAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  // Show suggestions if we've had multiple connection failures
  const connectionSuggestions = connectionAttempts >= 2 ? (
    <Alert variant="info" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        It looks like you're having persistent connection issues. You might try:
        <ul className="list-disc ml-5 mt-2">
          <li>Refreshing the page</li>
          <li>Checking your internet connection</li>
          <li>Waiting a few minutes and trying again</li>
        </ul>
      </AlertDescription>
    </Alert>
  ) : null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Assistant Preview</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        <ScrollArea ref={scrollAreaRef} className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'assistant' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'assistant'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  <ReactMarkdown components={{
                    // Apply styling to the content wrapper
                    p: ({ children }) => <p className="prose dark:prose-invert max-w-none">{children}</p>
                  }}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {connectionSuggestions}

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
