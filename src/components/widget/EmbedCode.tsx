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
      const chatApiEndpoint = `https://${projectRef}.supabase.co/functions/v1/chat`;
      
      const logoHtml = settings.logo_url ? 
        `<img src="${settings.logo_url}" alt="${settings.agent_name}" class="widget-logo" onerror="this.style.display='none';" />` : 
        '';
      
      const embedCode = `<!-- Welcome.Chat Widget CSS -->
<link href="https://cdn.welcome.chat/widget.css" rel="stylesheet" />

<!-- Widget Configuration -->
<script>
    window.WelcomeChatWidgetConfig = {
        branding: {
            name: '${settings.agent_name}',
            logo: '${settings.logo_url}',
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
    .welcome-chat-widget {
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
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    /* When the chat is expanded */
    .welcome-chat-widget.expanded {
        width: 350px; /* Adjust the width for the expanded chat */
        height: 500px; /* Adjust the height for the expanded chat */
        border-radius: 10px;
        bottom: 30px;
        ${settings.position}: 30px;
    }

    /* Chat content inside the widget */
    .welcome-chat-widget .chat-content {
        display: none;
        flex-direction: column;
        width: 100%;
        height: 100%;
        background-color: ${settings.background_color};
        border-radius: 10px;
        overflow: hidden;
    }

    /* When chat is expanded, show chat content */
    .welcome-chat-widget.expanded .chat-content {
        display: flex;
    }

    /* Icon for the collapsed state */
    .welcome-chat-widget .chat-icon {
        font-size: 30px;
        color: white;
    }
    
    /* Header styling */
    .chat-header {
        display: flex;
        align-items: center;
        padding: 12px 15px;
        background-color: ${settings.chat_color};
        color: white;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .chat-header .widget-logo {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        margin-right: 10px;
        object-fit: cover;
        background-color: white;
    }
    
    .chat-header .chat-title {
        font-weight: 500;
        flex: 1;
    }
    
    .chat-header .close-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 18px;
    }
    
    /* Messages area */
    .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
    }
    
    /* Message bubbles */
    .message {
        display: flex;
        margin-bottom: 15px;
        align-items: flex-end;
    }
    
    .message.user {
        justify-content: flex-end;
    }
    
    .message-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        margin-right: 8px;
        background-color: #f0f0f0;
        overflow: hidden;
    }
    
    .message.user .message-avatar {
        margin-left: 8px;
        margin-right: 0;
    }
    
    .message-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .message-bubble {
        max-width: 70%;
        padding: 10px 12px;
        border-radius: 18px;
        font-size: 14px;
        background-color: #f0f0f0;
        color: ${settings.text_color};
    }
    
    .message.user .message-bubble {
        background-color: ${settings.secondary_color};
        color: white;
        border-top-right-radius: 4px;
    }
    
    .message:not(.user) .message-bubble {
        border-top-left-radius: 4px;
    }
    
    /* Chat input area */
    .chat-input {
        display: flex;
        padding: 10px;
        border-top: 1px solid #eaeaea;
        background-color: white;
    }
    
    .chat-input input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 20px;
        margin-right: 8px;
        outline: none;
    }
    
    .chat-input input:focus {
        border-color: ${settings.chat_color};
    }
    
    .chat-input .send-button {
        background-color: ${settings.chat_color};
        color: white;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    /* You can cycle between icon sizes by double-clicking */
    .welcome-chat-widget .chat-icon.medium {
        font-size: 38px;
    }
    
    .welcome-chat-widget .chat-icon.large {
        font-size: 46px;
    }
</style>

<!-- Load Welcome.Chat Widget -->
<script type="module">
    import { createChat } from 'https://cdn.welcome.chat/widget.js';

    // Create the chat widget
    const chatWidget = createChat({
        apiEndpoint: '${chatApiEndpoint}'
    });

    // Add event listener to handle expand/collapse
    document.addEventListener('DOMContentLoaded', () => {
        const chatWidgetElement = document.querySelector('.welcome-chat-widget');
        const chatIcon = document.querySelector('.chat-icon');
        const chatContent = document.createElement('div');
        chatContent.classList.add('chat-content');
        
        // Add logo if available and handle logo loading errors
        chatContent.innerHTML = \`
            <div class="chat-header">
                ${logoHtml}
                <span class="chat-title">${settings.agent_name}</span>
                <button class="close-button">×</button>
            </div>
            <div class="chat-messages">
                <div class="message">
                    <div class="message-avatar">
                        ${logoHtml || '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background-color:#f0f0f0;color:#666;font-weight:bold;font-size:12px;">' + (settings.agent_name ? settings.agent_name.substring(0, 2).toUpperCase() : 'AI') + '</div>'}
                    </div>
                    <div class="message-bubble">
                        ${settings.welcome_text || "Hi 👋, how can I help?"}
                    </div>
                </div>
            </div>
            <div class="chat-input">
                <input type="text" placeholder="Type your message..." />
                <button class="send-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        \`;
        
        chatWidgetElement.appendChild(chatContent);

        // Toggle expanded state when widget is clicked
        chatWidgetElement.addEventListener('click', (e) => {
            // Skip toggling if clicking the close button
            if (e.target.classList.contains('close-button')) {
                chatWidgetElement.classList.remove('expanded');
                e.stopPropagation();
                return;
            }
            
            chatWidgetElement.classList.toggle('expanded');
        });
        
        // Handle close button click
        const closeButton = chatContent.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                chatWidgetElement.classList.remove('expanded');
                e.stopPropagation();
            });
        }
        
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
        
        // Handle sending messages
        const sendButton = chatContent.querySelector('.send-button');
        const inputField = chatContent.querySelector('input');
        
        if (sendButton && inputField) {
            const sendMessage = () => {
                const text = inputField.value.trim();
                if (text) {
                    // Add user message
                    const messagesContainer = chatContent.querySelector('.chat-messages');
                    messagesContainer.innerHTML += \`
                        <div class="message user">
                            <div class="message-bubble">\${text}</div>
                            <div class="message-avatar">
                                <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background-color:#aaa;color:white;font-weight:bold;font-size:12px;">YOU</div>
                            </div>
                        </div>
                    \`;
                    
                    // Clear input
                    inputField.value = '';
                    
                    // Scroll to bottom
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    
                    // Add AI response (in a real implementation, this would call your API)
                    setTimeout(() => {
                        messagesContainer.innerHTML += \`
                            <div class="message">
                                <div class="message-avatar">
                                    ${logoHtml || '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background-color:#f0f0f0;color:#666;font-weight:bold;font-size:12px;">' + (settings.agent_name ? settings.agent_name.substring(0, 2).toUpperCase() : 'AI') + '</div>'}
                                </div>
                                <div class="message-bubble">
                                    Thanks for your message! This is a demo of how the chat widget will look on your website.
                                </div>
                            </div>
                        \`;
                        
                        // Scroll to bottom again
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }, 1000);
                }
            };
            
            sendButton.addEventListener('click', sendMessage);
            
            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
    });
</script>

<!-- HTML for the chat icon -->
<div class="welcome-chat-widget">
    <div class="chat-icon">
        ${settings.logo_url ? 
          `<img src="${settings.logo_url}" alt="${settings.agent_name}" style="width:40px;height:40px;object-fit:cover;border-radius:50%;" onerror="this.parentNode.textContent='💬';">` : 
          '💬'}
    </div>
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
  
  // Pre-define logoHtml variable for the main display as well
  const logoHtmlDisplay = settings.logo_url ? 
    `<img src="${settings.logo_url}" alt="${settings.agent_name}" class="widget-logo" />` : 
    '';
  
  return (
    <div className="relative">
      <pre 
        ref={codeRef}
        className="p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto border border-gray-200 max-h-[300px] font-mono"
      >
{`<!-- Welcome.Chat Widget CSS -->
<link href="https://cdn.welcome.chat/widget.css" rel="stylesheet" />

<!-- Widget Configuration -->
<script>
    window.WelcomeChatWidgetConfig = {
        branding: {
            name: '${settings.agent_name}',
            logo: '${settings.logo_url}',
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
    .welcome-chat-widget {
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
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    /* When the chat is expanded */
    .welcome-chat-widget.expanded {
        width: 350px; /* Adjust the width for the expanded chat */
        height: 500px; /* Adjust the height for the expanded chat */
        border-radius: 10px;
        bottom: 30px;
        ${settings.position}: 30px;
    }

    /* Chat content inside the widget */
    .welcome-chat-widget .chat-content {
        display: none;
        flex-direction: column;
        width: 100%;
        height: 100%;
        background-color: ${settings.background_color};
        border-radius: 10px;
        overflow: hidden;
    }

    /* When chat is expanded, show chat content */
    .welcome-chat-widget.expanded .chat-content {
        display: flex;
    }

    /* Icon for the collapsed state */
    .welcome-chat-widget .chat-icon {
        font-size: 30px;
        color: white;
    }
    
    /* Header styling */
    .chat-header {
        display: flex;
        align-items: center;
        padding: 12px 15px;
        background-color: ${settings.chat_color};
        color: white;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .chat-header .widget-logo {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        margin-right: 10px;
        object-fit: cover;
        background-color: white;
    }
</style>

<!-- Load Welcome.Chat Widget -->
<script type="module">
    import { createChat } from 'https://cdn.welcome.chat/widget.js';

    // Create the chat widget with the AI assistant
    const chatWidget = createChat({
        apiEndpoint: 'https://${projectRef}.supabase.co/functions/v1/chat'
    });

    // Add event listener to handle expand/collapse
    document.addEventListener('DOMContentLoaded', () => {
        // ... keep existing code (DOM manipulation and event handlers)
    });
</script>

<!-- HTML for the chat icon -->
<div class="welcome-chat-widget">
    <div class="chat-icon">
        ${settings.logo_url ? 
          `<img src="${settings.logo_url}" alt="${settings.agent_name}" style="width:40px;height:40px;object-fit:cover;border-radius:50%;" onerror="this.parentNode.textContent='💬';">` : 
          '💬'}
    </div>
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

