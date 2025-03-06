
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";

interface EmbedCodeProps {
  settings: WidgetSettings;
  onCopy?: () => void;
}

export function EmbedCode({ settings, onCopy }: EmbedCodeProps) {
  const { toast } = useToast();
  const codeRef = useRef<HTMLPreElement>(null);
  
  // Get the Supabase project reference from the URL
  const projectRef = SUPABASE_URL.split("https://")[1]?.split(".supabase.co")[0];

  // Syntax highlighting effect
  useEffect(() => {
    if (codeRef.current) {
      const keywords = ["window", "script", "const", "let", "var", "function", "return", "new", "true", "false"];
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
      const embedCode = `<!-- Widget Configuration -->
<script>
    window.ChatWidgetConfig = {
        webhook: {
            url: '${settings.webhook_url || `https://${projectRef}.supabase.co/functions/v1/chat`}',
            route: 'general'
        },
        branding: {
            logo: '${settings.logo_url}',
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
<script src="https://${projectRef}.supabase.co/storage/v1/object/public/widget/chat-widget.js"></script>
<!-- Widget Script End -->`;

      navigator.clipboard.writeText(embedCode);
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

  return (
    <div className="relative">
      <pre 
        ref={codeRef}
        className="p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto border border-gray-200 max-h-[300px] font-mono"
      >
{`<script>
  window.CHATBOT_CONFIG = {
    clientId: "${settings.agent_name}",
    settings: {
      agentName: "${settings.agent_name}",
      logoUrl: "${settings.logo_url}",
      chatColor: "${settings.chat_color}",
      backgroundColor: "${settings.background_color}",
      textColor: "${settings.text_color}",
      secondaryColor: "${settings.secondary_color}",
      position: "${settings.position}",
      welcomeText: "${settings.welcome_text}",
      responseTimeText: "${settings.response_time_text}"
    },
    apiEndpoint: "https://${projectRef}.supabase.co/functions/v1/chat"
  };
</script>
<script src="https://${projectRef}.supabase.co/storage/v1/object/public/widget/chat-widget.js" async></script>`}
      </pre>
      <Button
        size="sm"
        onClick={handleCopyCode}
        className="absolute top-2 right-2 bg-indigo-600 hover:bg-indigo-700"
      >
        <Copy className="w-4 h-4 mr-2" />
        Copy Code
      </Button>
    </div>
  );
}
