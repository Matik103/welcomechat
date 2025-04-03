
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '@/config/env';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight, Check, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LlamaIndexConfigFormProps {
  onApiKeySet?: (apiKey: string, openaiApiKey: string) => void;
}

export function LlamaIndexConfigForm({ onApiKeySet }: LlamaIndexConfigFormProps) {
  const [llamaApiKey, setLlamaApiKey] = useState(LLAMA_CLOUD_API_KEY || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(OPENAI_API_KEY || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveApiKey = async () => {
    if (!llamaApiKey.trim()) {
      setError('LlamaIndex API key is required');
      return;
    }

    if (!openaiApiKey.trim()) {
      setError('OpenAI API key is required for LlamaIndex document processing');
      return;
    }

    if (!llamaApiKey.startsWith('llx-')) {
      setError('LlamaIndex API key should start with "llx-"');
      return;
    }

    if (!openaiApiKey.startsWith('sk-')) {
      setError('OpenAI API key should start with "sk-"');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Save API keys to Supabase Edge Function Secrets
      // This would normally be done via admin functions
      // For now, just notify the user to set it in environment
      
      toast.success('API keys format is valid');
      
      if (onApiKeySet) {
        onApiKeySet(llamaApiKey, openaiApiKey);
      }
    } catch (err) {
      console.error('Error saving API keys:', err);
      setError('Failed to save API keys');
      toast.error('Failed to save API keys');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if both required API keys are configured - convert to boolean explicitly
  const areKeysConfigured = Boolean(LLAMA_CLOUD_API_KEY && OPENAI_API_KEY);

  return (
    <Card>
      <CardHeader>
        <CardTitle>LlamaIndex API Configuration</CardTitle>
        <CardDescription>
          API keys are preconfigured for document parsing functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="llamaindex-api-key">LlamaIndex API Key</Label>
          <Input
            id="llamaindex-api-key"
            type="password"
            placeholder="llx-..."
            value={llamaApiKey}
            onChange={(e) => setLlamaApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Your LlamaIndex API key starts with "llx-". It's already configured for this application.
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="openai-api-key">OpenAI API Key</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    LlamaIndex requires an OpenAI API key to process documents.
                    This is used for the underlying AI model that extracts and
                    processes the text content.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="openai-api-key"
            type="password"
            placeholder="sk-..."
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            OpenAI API key starts with "sk-". It's already configured for this application.
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {areKeysConfigured && (
          <Alert className="bg-green-50 border-green-100">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              LlamaIndex and OpenAI API keys are already configured.
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
          <Button onClick={handleSaveApiKey} disabled={isSaving || areKeysConfigured}>
            {isSaving ? 'Saving...' : 'Validate API Keys'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
