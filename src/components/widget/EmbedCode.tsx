
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
      const keywords = ["window", "script", "const", "let", "var", "function", "return", "new", "true", "false", "import", "from", "document", "addEventListener", "querySelector", "createElement", "appendChild", "classList", "toggle", "add"];
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

<!-- Add custom CSS for expandable behavior -->
<style>
    /* Chat container styling */
    .n8n-chat-widget {
        position: fixed;
        ${settings.position}: 20px;
        bottom: 20px;
        z-index: 9999;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${settings.chat_color};
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    /* When the chat is expanded */
    .n8n-chat-widget.expanded {
        width: 350px; /* Adjust the width for the expanded chat */
        height: 400px; /* Adjust the height for the expanded chat */
        border-radius: 10px;
        bottom: 30px;
        ${settings.position}: 30px;
    }

    /* Chat content inside the widget */
    .n8n-chat-widget .chat-content {
        display: none;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: 10px;
        background-color: ${settings.background_color};
        border-radius: 10px;
    }

    /* When chat is expanded, show chat content */
    .n8n-chat-widget.expanded .chat-content {
        display: flex;
    }

    /* Icon for the collapsed state */
    .n8n-chat-widget .chat-icon {
        font-size: 30px;
        color: white;
    }
    
    /* You can cycle between icon sizes by double-clicking */
    .n8n-chat-widget .chat-icon.medium {
        font-size: 38px;
    }
    
    .n8n-chat-widget .chat-icon.large {
        font-size: 46px;
    }
</style>

<!-- Load n8n Chat Widget -->
<script type="module">
    import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

    // Create the chat widget
    const chatWidget = createChat({
        webhookUrl: '${webhookUrl}'
    });

    // Add event listener to handle expand/collapse
    document.addEventListener('DOMContentLoaded', () => {
        const chatWidgetElement = document.querySelector('.n8n-chat-widget');
        const chatIcon = document.querySelector('.chat-icon');
        const chatContent = document.createElement('div');
        chatContent.classList.add('chat-content');
        chatContent.innerHTML = \`
            <div>Welcome to the chat!</div>
            <!-- Chat widget content will be dynamically inserted here -->
        \`;
        chatWidgetElement.appendChild(chatContent);

        chatWidgetElement.addEventListener('click', () => {
            chatWidgetElement.classList.toggle('expanded');
        });
        
        // Add double-click to cycle through icon sizes
        chatWidgetElement.addEventListener('dblclick', (e) => {
            if (!chatWidgetElement.classList.contains('expanded')) {
                // Prevent expansion on double-click
                e.stopPropagation();
                
                // Cycle through icon sizes
                if (chatIcon.classList.contains('medium')) {
                    chatIcon.classList.remove('medium');
                    chatIcon.classList.add('large');
                } else if (chatIcon.classList.contains('large')) {
                    chatIcon.classList.remove('large');
                } else {
                    chatIcon.classList.add('medium');
                }
            }
        });
    });
</script>

<!-- HTML for the chat icon -->
<div class="n8n-chat-widget">
    <div class="chat-icon">💬</div>
</div>`;

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

<!-- Add custom CSS for expandable behavior -->
<style>
    /* Chat container styling */
    .n8n-chat-widget {
        position: fixed;
        ${settings.position}: 20px;
        bottom: 20px;
        z-index: 9999;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${settings.chat_color};
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    /* When the chat is expanded */
    .n8n-chat-widget.expanded {
        width: 350px; /* Adjust the width for the expanded chat */
        height: 400px; /* Adjust the height for the expanded chat */
        border-radius: 10px;
        bottom: 30px;
        ${settings.position}: 30px;
    }

    /* Chat content inside the widget */
    .n8n-chat-widget .chat-content {
        display: none;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: 10px;
        background-color: ${settings.background_color};
        border-radius: 10px;
    }

    /* When chat is expanded, show chat content */
    .n8n-chat-widget.expanded .chat-content {
        display: flex;
    }

    /* Icon for the collapsed state */
    .n8n-chat-widget .chat-icon {
        font-size: 30px;
        color: white;
    }
    
    /* You can cycle between icon sizes by double-clicking */
    .n8n-chat-widget .chat-icon.medium {
        font-size: 38px;
    }
    
    .n8n-chat-widget .chat-icon.large {
        font-size: 46px;
    }
</style>

<!-- Load n8n Chat Widget -->
<script type="module">
    import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

    // Create the chat widget
    const chatWidget = createChat({
        webhookUrl: '${webhookUrl}'
    });

    // Add event listener to handle expand/collapse
    document.addEventListener('DOMContentLoaded', () => {
        const chatWidgetElement = document.querySelector('.n8n-chat-widget');
        const chatIcon = document.querySelector('.chat-icon');
        const chatContent = document.createElement('div');
        chatContent.classList.add('chat-content');
        chatContent.innerHTML = \`
            <div>Welcome to the chat!</div>
            <!-- Chat widget content will be dynamically inserted here -->
        \`;
        chatWidgetElement.appendChild(chatContent);

        chatWidgetElement.addEventListener('click', () => {
            chatWidgetElement.classList.toggle('expanded');
        });
        
        // Add double-click to cycle through icon sizes
        chatWidgetElement.addEventListener('dblclick', (e) => {
            if (!chatWidgetElement.classList.contains('expanded')) {
                // Prevent expansion on double-click
                e.stopPropagation();
                
                // Cycle through icon sizes
                if (chatIcon.classList.contains('medium')) {
                    chatIcon.classList.remove('medium');
                    chatIcon.classList.add('large');
                } else if (chatIcon.classList.contains('large')) {
                    chatIcon.classList.remove('large');
                } else {
                    chatIcon.classList.add('medium');
                }
            }
        });
    });
</script>

<!-- HTML for the chat icon -->
<div class="n8n-chat-widget">
    <div class="chat-icon">💬</div>
</div>`}
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
