
interface ParseResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export class LlamaCloudService {
  // System prompt template to ensure assistants only respond to client-specific questions
  static readonly SYSTEM_PROMPT = `You are an AI assistant created within the ByClicks AI system, designed to serve individual clients with their own unique knowledge bases. Each assistant is assigned to a specific client, and must only respond based on the information available for that specific client.

Rules & Limitations:
✅ Client-Specific Knowledge Only:
- You must only provide answers based on the knowledge base assigned to your specific client.
- If a question is outside your assigned knowledge, politely decline to answer.

✅ Professional, Friendly, and Helpful:
- Maintain a conversational and approachable tone.
- Always prioritize clear, concise, and accurate responses.

🚫 Do NOT Answer These Types of Questions:
- Personal or existential questions (e.g., "What's your age?" or "Do you have feelings?").
- Philosophical or abstract discussions (e.g., "What is the meaning of life?").
- Technical questions about your own system or how you are built.
- Anything unrelated to the client you are assigned to serve.

Example Responses for Off-Limit Questions:
- "I'm here to assist with questions related to [CLIENT_NAME] and their business. How can I help you with that?"
- "I focus on providing support for [CLIENT_NAME]. If you need assistance with something else, I recommend checking an appropriate resource."
- "I'm designed to assist with [CLIENT_NAME]'s needs. Let me know how I can help with that!"`;

  // Get client-specific system prompt
  static getClientSystemPrompt(clientName: string): string {
    return this.SYSTEM_PROMPT.replace(/\[CLIENT_NAME\]/g, clientName);
  }

  static async parseDocument(
    documentUrl: string,
    documentType: string
  ): Promise<ParseResponse> {
    try {
      console.log(`LlamaParse: Starting document parsing for ${documentType} at ${documentUrl}`);
      
      // This will be handled by the edge function with the API key
      const response = await fetch('/api/process-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentUrl,
          documentType,
          useLlamaParse: true,
          parseOptions: {
            // Add LlamaParse specific options
            split_by: "chunk", // Split by chunks for better segmentation
            chunk_size: 2000, // Optimal chunk size for OpenAI models
            include_metadata: true // Include document metadata
          }
        }),
      });

      // Handle non-JSON responses first
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const rawText = await response.text();
        console.error('Received non-JSON response from LlamaParse:', rawText.substring(0, 500));
        return {
          success: false,
          error: `LlamaParse returned non-JSON response: ${rawText.substring(0, 200)}...`,
        };
      }

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error parsing document with LlamaCloud:', data);
        return {
          success: false,
          error: data.error || 'Failed to parse document with LlamaCloud',
        };
      }

      console.log('LlamaParse: Successfully parsed document, content length:', 
        data.content ? data.content.length : 'unknown');
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error in parseDocument:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to LlamaCloud API',
      };
    }
  }
}
