
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { WidgetSettings } from '@/types/widget-settings';

export interface EmbedCodeProps {
  settings: WidgetSettings;
  onCopy: () => void;
}

export function EmbedCodeCard({ settings, onCopy }: EmbedCodeProps) {
  const [isCopied, setIsCopied] = useState(false);
  const embedCodeRef = useRef<HTMLInputElement>(null);

  const handleCopyClick = () => {
    if (embedCodeRef.current) {
      embedCodeRef.current.select();
      document.execCommand('copy');
      setIsCopied(true);
      onCopy();
      toast.success('Code copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const embedCode = `<script 
  src="https://cdn.gpteng.co/gptengineer.js"
  data-client-id="${settings.clientId}"
  data-agent-name="${settings.agent_name}"
  data-agent-description="${settings.agent_description}"
  data-logo-url="${settings.logo_url}"
  data-chat-color="${settings.chat_color}"
  data-background-color="${settings.background_color}"
  data-font-color="${settings.font_color}"
  data-chat-font-color="${settings.chat_font_color}"
  data-background-opacity="${settings.background_opacity}"
  data-button-text="${settings.button_text}"
  data-position="${settings.position}"
  data-greeting-message="${settings.greeting_message}"
  data-text-color="${settings.text_color}"
  data-secondary-color="${settings.secondary_color}"
  data-welcome-text="${settings.welcome_text}"
  data-response-time-text="${settings.response_time_text}"
  data-display-mode="${settings.display_mode}"
  ${settings.openai_assistant_id ? `data-openai-assistant-id="${settings.openai_assistant_id}"` : ''}
  data-deepseek-enabled="${settings.deepseek_enabled}"
  data-deepseek-model="${settings.deepseek_model}"
  data-openai-enabled="${settings.openai_enabled}"
  data-openai-model="${settings.openai_model}"
></script>`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embed Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Copy and paste this code into the <code>&lt;body&gt;</code> of your website.
        </p>
        <div className="grid gap-2">
          <Input
            ref={embedCodeRef}
            readOnly
            value={embedCode}
            className="text-xs font-mono"
          />
        </div>
        <Button onClick={handleCopyClick} disabled={isCopied}>
          {isCopied ? 'Copied!' : 'Copy Code'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function EmbedCodeCards({ settings, onCopy }: EmbedCodeProps) {
  return (
    <div className="space-y-8">
      <EmbedCodeCard settings={settings} onCopy={onCopy} />
    </div>
  );
}

export default EmbedCodeCard;
