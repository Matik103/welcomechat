
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LLAMA_CLOUD_API_KEY } from '@/config/env';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface LlamaIndexConfigFormProps {
  onApiKeySet?: (apiKey: string) => void;
}

export function LlamaIndexConfigForm({ onApiKeySet }: LlamaIndexConfigFormProps) {
  const [apiKey, setApiKey] = useState(LLAMA_CLOUD_API_KEY || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    if (!apiKey.startsWith('llx-')) {
      setError('LlamaIndex API key should start with "llx-"');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Save API key to Supabase Edge Function Secrets
      // This would normally be done via admin functions
      // For now, just notify the user to set it in environment
      
      toast.success('API key format is valid');
      
      if (onApiKeySet) {
        onApiKeySet(apiKey);
      }
    } catch (err) {
      console.error('Error saving API key:', err);
      setError('Failed to save API key');
      toast.error('Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>LlamaIndex API Configuration</CardTitle>
        <CardDescription>
          Enter your LlamaIndex API key to enable document parsing functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="llamaindex-api-key">LlamaIndex API Key</Label>
          <Input
            id="llamaindex-api-key"
            type="password"
            placeholder="llx-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Your LlamaIndex API key starts with "llx-". You can find it in your LlamaIndex Cloud dashboard.
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {LLAMA_CLOUD_API_KEY && (
          <Alert className="bg-green-50 border-green-100">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              LlamaIndex API key is already configured in environment variables.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between items-center pt-2">
          <a 
            href="https://cloud.llamaindex.ai/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            Visit LlamaIndex Cloud
            <ArrowRight className="h-4 w-4 ml-1" />
          </a>
          <Button onClick={handleSaveApiKey} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Validate API Key'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
