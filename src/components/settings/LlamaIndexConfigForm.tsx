
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight, Check, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

interface LlamaIndexConfigFormProps {
  onApiKeySet?: (apiKey: string, openaiApiKey: string) => void;
}

export function LlamaIndexConfigForm({ onApiKeySet }: LlamaIndexConfigFormProps) {
  const [llamaApiKey, setLlamaApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keysConfigured, setKeysConfigured] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // Check if keys already exist in Supabase
  useEffect(() => {
    const checkExistingKeys = async () => {
      try {
        setIsChecking(true);
        const { data, error } = await supabase.functions.invoke('get-secrets', {
          body: {
            keys: ['LLAMA_CLOUD_API_KEY', 'OPENAI_API_KEY']
          }
        });
        
        if (error) {
          console.error('Error checking API keys:', error);
          return;
        }
        
        const hasLlamaKey = !!data?.LLAMA_CLOUD_API_KEY;
        const hasOpenAIKey = !!data?.OPENAI_API_KEY;
        
        setKeysConfigured(hasLlamaKey && hasOpenAIKey);
        
        if (hasLlamaKey) {
          setLlamaApiKey('●●●●●●●●●●●●●●●●●●●●●●●●●');
        }
        
        if (hasOpenAIKey) {
          setOpenaiApiKey('●●●●●●●●●●●●●●●●●●●●●●●●●');
        }
      } catch (err) {
        console.error('Error checking for existing keys:', err);
      } finally {
        setIsChecking(false);
      }
    };

    checkExistingKeys();
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

    // Don't validate if using placeholder masked keys (already validated)
    if (llamaApiKey !== '●●●●●●●●●●●●●●●●●●●●●●●●●' && !llamaApiKey.startsWith('llx-')) {
      setError('LlamaIndex API key should start with "llx-"');
      return;
    }

    if (openaiApiKey !== '●●●●●●●●●●●●●●●●●●●●●●●●●' && !openaiApiKey.startsWith('sk-')) {
      setError('OpenAI API key should start with "sk-"');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // We'll just validate format if keys are already set
      if (llamaApiKey === '●●●●●●●●●●●●●●●●●●●●●●●●●' && openaiApiKey === '●●●●●●●●●●●●●●●●●●●●●●●●●') {
        toast.success('API keys are already configured and valid');
        setKeysConfigured(true);
        return;
      }
      
      toast.success('API keys format is valid');
      setKeysConfigured(true);
      
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>LlamaIndex API Configuration</CardTitle>
        <CardDescription>
          API keys for document parsing functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isChecking ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
            <span className="text-sm text-muted-foreground">Checking configuration...</span>
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
                disabled={keysConfigured && llamaApiKey === '●●●●●●●●●●●●●●●●●●●●●●●●●'}
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
                disabled={keysConfigured && openaiApiKey === '●●●●●●●●●●●●●●●●●●●●●●●●●'}
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
              <Button onClick={handleSaveApiKey} disabled={isSaving || (keysConfigured && llamaApiKey === '●●●●●●●●●●●●●●●●●●●●●●●●●')}>
                {isSaving ? 'Saving...' : keysConfigured ? 'Keys Configured' : 'Validate API Keys'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
