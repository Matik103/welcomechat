
import { toast } from "sonner";

/**
 * Test the DeepSeek API with a simple message
 * @param apiKey - The DeepSeek API key
 * @returns Promise that resolves with the API response
 */
export const testDeepseekApi = async (apiKey: string): Promise<any> => {
  try {
    console.log("Testing DeepSeek API connection...");
    
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello! This is a test message." }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
      console.error("DeepSeek API error:", errorData);
      toast.error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      return { success: false, error: errorData };
    }
    
    const data = await response.json();
    console.log("DeepSeek API response:", data);
    toast.success("DeepSeek API connection successful!");
    
    return { success: true, data };
  } catch (error) {
    console.error("Error testing DeepSeek API:", error);
    toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { success: false, error };
  }
};
