
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function APITest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testOpenAI = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Call the edge function directly
      const { data, error } = await supabase.functions.invoke('test-openai-key', {
        body: { test: true }
      });
      
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
      setError(`Exception: ${err instanceof Error ? err.message : String(err)}`);
      toast.error('API test failed with exception');
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
        <Button 
          onClick={testOpenAI} 
          disabled={isLoading}
        >
          {isLoading ? 'Testing...' : 'Test OpenAI API Key'}
        </Button>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {result && (
          <div className="p-4 bg-gray-100 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
