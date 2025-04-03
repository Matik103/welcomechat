
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '@/config/env';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight, Check, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSecrets, checkRequiredSecrets } from '@/services/secretsService';

interface LlamaIndexConfigFormProps {
  onApiKeySet?: (apiKey: string, openaiApiKey: string) => void;
}

export function LlamaIndexConfigForm({ onApiKeySet }: LlamaIndexConfigFormProps) {
  const [llamaApiKey, setLlamaApiKey] = useState(LLAMA_CLOUD_API_KEY || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(OPENAI_API_KEY || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keysConfigured, setKeysConfigured] = useState(false);

  useEffect(() => {
    const loadSecrets = async () => {
      setIsLoading(true);
      try {
        // Check if keys are already set via env vars
        if (LLAMA_CLOUD_API_KEY && OPENAI_API_KEY) {
          setKeysConfigured(true);
          setIsLoading(false);
          return;
        }

        // Try to get keys from Supabase secrets
        const secrets = await getSecrets(['LLAMA_CLOUD_API_KEY', 'OPENAI_API_KEY']);
        
        if (secrets.LLAMA_CLOUD_API_KEY) {
          setLlamaApiKey(secrets.LLAMA_CLOUD_API_KEY);
        }
        
        if (secrets.OPENAI_API_KEY) {
          setOpenaiApiKey(secrets.OPENAI_API_KEY);
        }

        // Check if both keys are available
        setKeysConfigured(!!(secrets.LLAMA_CLOUD_API_KEY && secrets.OPENAI_API_KEY));
      } catch (err) {
        console.error('Failed to load secrets:', err);
        setError('Failed to load API keys from server');
      } finally {
        setIsLoading(false);
      }
    };

    loadSecrets();
  }, []);

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
      
      setKeysConfigured(true);
    } catch (err) {
      console.error('Error saving API keys:', err);
      setError('Failed to save API keys');
      toast.error('Failed to save API keys');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>LlamaIndex API Configuration</CardTitle>
        <CardDescription>
          API keys are required for document parsing functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2">Loading API keys...</span>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="llamaindex-api-key">LlamaIndex API Key</Label>
              <Input
                id="llamaindex-api-key"
                type="password"
                placeholder="llx-..."
                value={llamaApiKey}
                onChange={(e) => setLlamaApiKey(e.target.value)}
                disabled={keysConfigured}
              />
              <p className="text-xs text-muted-foreground">
                Your LlamaIndex API key starts with "llx-".
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
                disabled={keysConfigured}
              />
              <p className="text-xs text-muted-foreground">
                OpenAI API key starts with "sk-". 
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {keysConfigured && (
              <Alert className="bg-green-50 border-green-100">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  LlamaIndex and OpenAI API keys are configured.
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
              <Button 
                onClick={handleSaveApiKey} 
                disabled={isSaving || keysConfigured}
              >
                {isSaving ? 'Saving...' : 'Validate API Keys'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
