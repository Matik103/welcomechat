
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info, RefreshCw } from 'lucide-react';

export function APITest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const testOpenAI = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setAttempts(prev => prev + 1);
    
    try {
      // Add a timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000);
      });
      
      // Call the edge function
      const functionPromise = supabase.functions.invoke('test-openai-key', {
        body: { 
          test: true,
          timestamp: new Date().toISOString() // Add timestamp to prevent caching
        }
      });
      
      // Race between the function call and the timeout
      const { data, error } = await Promise.race([
        functionPromise,
        timeoutPromise.then(() => {
          throw new Error('Request timed out after 15 seconds');
        })
      ]) as { data: any; error: any };
      
      if (error) {
        console.error('Error testing OpenAI API:', error);
        setError(`Error: ${error.message}`);
        toast.error('API test failed');
        return;
      }
      
      if (data.error) {
        setError(`API Error: ${data.error}`);
        toast.error('OpenAI API test failed');
        return;
      }
      
      setResult(JSON.stringify(data, null, 2));
      toast.success('OpenAI API test successful!');
    } catch (err) {
      console.error('Exception testing OpenAI API:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Exception: ${errorMessage}`);
      
      if (errorMessage.includes('timeout') || errorMessage.includes('Failed to send a request')) {
        toast.error('Connection to Edge Function failed. Network issue detected.');
      } else {
        toast.error('API test failed with exception');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>OpenAI API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={testOpenAI} 
            disabled={isLoading}
          >
            {isLoading ? 'Testing...' : 'Test OpenAI API Key'}
          </Button>
          
          {attempts > 0 && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={testOpenAI}
              disabled={isLoading}
              title="Retry test"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {error.includes('Failed to send a request') && (
                <div className="mt-2 text-sm">
                  <p>This could be due to:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Network connectivity issues</li>
                    <li>Edge Function not deployed properly</li>
                    <li>Edge Function timeout or error</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {result && (
          <div className="p-4 bg-gray-100 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm text-muted-foreground">
            This test verifies connectivity to your OpenAI API key through a Supabase Edge Function. 
            If the test fails, check the Edge Function logs in the Supabase dashboard.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
