
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";
import { useToast } from "@/components/ui/use-toast";
import { SUPABASE_URL } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";

interface EmbedCodeProps {
  settings: WidgetSettings;
  onCopy?: () => void;
}

export function EmbedCode({ settings, onCopy }: EmbedCodeProps) {
  const { toast } = useToast();
  const codeRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  
  // Get the Supabase project reference from the URL
  const projectRef = SUPABASE_URL.split("https://")[1]?.split(".supabase.co")[0];

  // Syntax highlighting effect
  useEffect(() => {
    if (codeRef.current) {
      const keywords = ["window", "script", "const", "let", "var", "function", "return", "new", "true", "false", "import", "from"];
      let html = codeRef.current.innerHTML;
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        html = html.replace(regex, `<span class="text-purple-600">${keyword}</span>`);
      });
      
      // Highlight strings
      html = html.replace(/"(.*?)"/g, '<span class="text-green-600">"$1"</span>');
      
      // Highlight properties
      html = html.replace(/(\w+):/g, '<span class="text-blue-600">$1</span>:');
      
      codeRef.current.innerHTML = html;
    }
  }, [settings]);

  const handleCopyCode = () => {
    try {
      const webhookUrl = settings.webhook_url || `https://${projectRef}.supabase.co/functions/v1/chat`;
      
      const embedCode = `<!-- Load n8n Chat Widget CSS -->
<link href="https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css" rel="stylesheet" />

<!-- Widget Configuration -->
<script>
    window.ChatWidgetConfig = {
        branding: {
            name: '${settings.agent_name}',
            welcomeText: '${settings.welcome_text}',
            responseTimeText: '${settings.response_time_text}'
        },
        style: {
            primaryColor: '${settings.chat_color}',
            secondaryColor: '${settings.secondary_color}',
            position: '${settings.position}',
            backgroundColor: '${settings.background_color}',
            fontColor: '${settings.text_color}'
        }
    };
</script>

<!-- Load n8n Chat Widget -->
<script type="module">
    import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

    createChat({
        webhookUrl: '${webhookUrl}'
    });
</script>`;

      navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Code copied! 📋",
        description: "The widget code has been copied to your clipboard.",
      });
      
      // Call the onCopy callback if provided
      if (onCopy) {
        onCopy();
      }
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast({
        title: "Copy failed",
        description: "Could not copy code to clipboard. Please try again.",
        variant: "destructive"
      });
    }
  };

  const webhookUrl = settings.webhook_url || `https://${projectRef}.supabase.co/functions/v1/chat`;
  
  return (
    <div className="relative">
      <pre 
        ref={codeRef}
        className="p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto border border-gray-200 max-h-[300px] font-mono"
      >
{`<!-- Load n8n Chat Widget CSS -->
<link href="https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css" rel="stylesheet" />

<!-- Widget Configuration -->
<script>
    window.ChatWidgetConfig = {
        branding: {
            name: '${settings.agent_name}',
            welcomeText: '${settings.welcome_text}',
            responseTimeText: '${settings.response_time_text}'
        },
        style: {
            primaryColor: '${settings.chat_color}',
            secondaryColor: '${settings.secondary_color}',
            position: '${settings.position}',
            backgroundColor: '${settings.background_color}',
            fontColor: '${settings.text_color}'
        }
    };
</script>

<!-- Load n8n Chat Widget -->
<script type="module">
    import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

    createChat({
        webhookUrl: '${webhookUrl}'
    });
</script>`}
      </pre>
      <Button
        size="sm"
        onClick={handleCopyCode}
        className="absolute top-2 right-2 bg-indigo-600 hover:bg-indigo-700"
      >
        <Copy className="w-4 h-4 mr-2" />
        {copied ? "Copied!" : "Copy Code"}
      </Button>
    </div>
  );
}
