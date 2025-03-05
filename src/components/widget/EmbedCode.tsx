
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmbedCodeProps {
  settings: WidgetSettings;
}

export function EmbedCode({ settings }: EmbedCodeProps) {
  const { toast } = useToast();
  
  // Get the Supabase project reference from the client file's constant
  // We access it directly from the imported file since the client might not expose it as a method
  const SUPABASE_URL = "https://mgjodiqecnnltsgorife.supabase.co";
  const projectRef = SUPABASE_URL.split("https://")[1]?.split(".supabase.co")[0];

  const handleCopyCode = () => {
    const embedCode = `<!-- Widget Configuration -->
<script>
    window.ChatWidgetConfig = {
        webhook: {
            url: 'https://${projectRef}.supabase.co/functions/v1/chat',
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
    settings: ${JSON.stringify(settings, null, 2)},
    apiEndpoint: "https://${projectRef}.supabase.co/functions/v1/chat"
  };
</script>
<script src="https://${projectRef}.supabase.co/storage/v1/object/public/widget/chat-widget.js" async></script>`}
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
