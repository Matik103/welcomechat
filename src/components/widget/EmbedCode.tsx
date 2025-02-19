
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";
import { useToast } from "@/components/ui/use-toast";

interface EmbedCodeProps {
  settings: WidgetSettings;
}

export function EmbedCode({ settings }: EmbedCodeProps) {
  const { toast } = useToast();

  const handleCopyCode = () => {
    const embedCode = `<!-- Widget Configuration -->
<script>
    window.ChatWidgetConfig = {
        webhook: {
            url: '${settings.webhook_url}',
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
<script src="https://cdn.jsdelivr.net/gh/WayneSimpson/n8n-chatbot-template@ba944c3/chat-widget.js"></script>
<!-- Widget Script -->`;

    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Code copied! 📋",
      description: "The widget code has been copied to your clipboard.",
    });
  };

  return (
    <div className="relative">
      <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto">
        {`<script>
  window.CHATBOT_CONFIG = {
    clientId: "${settings.agent_name}",
    settings: ${JSON.stringify(settings, null, 2)}
  };
</script>
<script src="https://cdn.example.com/widget.js" async></script>`}
      </pre>
      <Button
        size="sm"
        onClick={handleCopyCode}
        className="absolute top-2 right-2"
      >
        <Copy className="w-4 h-4 mr-2" />
        Copy Code
      </Button>
    </div>
  );
}
