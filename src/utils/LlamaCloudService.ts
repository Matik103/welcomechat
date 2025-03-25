import { createClient } from '@supabase/supabase-js'
import { ParseResponse } from '@/types/document-processing';
import { callRpcFunction } from '@/utils/rpcUtils';

// Add these utility functions at the top of the file after imports
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 32000,    // 32 seconds
  factor: 2,          // exponential factor
};

async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = retryOptions.initialDelay;

  for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === retryOptions.maxAttempts) {
        throw new Error(`Failed after ${attempt} attempts. Last error: ${lastError.message}`);
      }

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      await sleep(delay);
      delay = Math.min(delay * retryOptions.factor, retryOptions.maxDelay);
    }
  }

  throw lastError; // TypeScript requires this, but it should never be reached
}

interface ProcessDocumentBody {
  documentUrl: string;
  documentType: string;
  clientId: string;
  agentName: string;
  documentId: string;
}

interface CreateAssistantBody {
  client_id: string;
  agent_name: string;
  agent_description?: string;
}

interface UploadDocumentBody {
  client_id: string;
  document_url: string;
  document_type: string;
  document_content: string;
  document_title: string;
}

type TestBody = { test: boolean } | ProcessDocumentBody | CreateAssistantBody | UploadDocumentBody;

export class LlamaParseError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'LlamaParseError';
  }
}

export class LlamaCloudService {
  private supabaseUrl: string
  private supabaseKey: string

  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL || ''
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''
  }

  private getSupabaseClient() {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);
    return supabase;
  }

  static async parseDocument(documentUrl: string, documentType: string, clientId: string, agentName: string): Promise<{ content: string; metadata: any }> {
    if (!documentUrl || !documentType || !clientId || !agentName) {
      throw new LlamaParseError('Missing required parameters', 'INVALID_PARAMS')
    }

    const supabase = LlamaCloudService.getSupabaseClient()

    try {
      // Process the document using the process-document Edge Function
      const { data: processData, error: processError } = await supabase.functions.invoke('process-document', {
        method: 'POST',
        body: {
          documentUrl,
          documentType,
          clientId,
          agentName,
          documentId: crypto.randomUUID()
        }
      });

      if (processError) {
        throw new LlamaParseError(`Error processing document: ${processError.message}`, 'PROCESSING_ERROR')
      }

      return {
        content: processData.content || '',
        metadata: processData.metadata || {}
      }
    } catch (error) {
      console.error('Error in parseDocument:', error)
      throw new LlamaParseError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'PROCESSING_ERROR'
      )
    }
  }

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

  private static readonly LLAMA_CLOUD_BASE_URL = 'https://api.cloud.llamaindex.ai';
  
  // Replace direct access to process.env with a method to get API key safely in browser context
  private static getLlamaCloudApiKey(): string {
    const apiKey = process.env.VITE_LLAMA_CLOUD_API_KEY || '';
    if (!apiKey || !apiKey.startsWith('llx-')) {
      throw new LlamaParseError(
        'Invalid LLAMA_CLOUD_API_KEY format. Key should start with "llx-"',
        'INVALID_API_KEY'
      );
    }
    return apiKey;
  }

  private static getLlamaCloudRegion(): string {
    return process.env.VITE_LLAMA_CLOUD_REGION || 'us-east-1';
  }

  private static getLlamaCloudUrl(): string {
    const region = this.getLlamaCloudRegion();
    if (region === 'us-east-1') {
      return `${this.LLAMA_CLOUD_BASE_URL}/api/parsing`;
    }
    return `${this.LLAMA_CLOUD_BASE_URL}/${region}/api/parsing`;
  }

  private static getSupabaseClient() {
    return createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_ANON_KEY || ''
    );
  }

  /**
   * Creates embeddings and stores them in the vector database
   * This would typically be done after document parsing
   */
  static async createEmbeddings(
    clientId: string,
    agentName: string,
    documentId: string
  ): Promise<ParseResponse> {
    try {
      const supabase = this.getSupabaseClient();
      console.log(`Creating embeddings for document ${documentId}`);
      
      // Call a Supabase function to create embeddings (we'd need to create this)
      const { data, error } = await supabase.functions.invoke('create-embeddings', {
        method: 'POST',
        body: {
          clientId,
          agentName,
          documentId
        },
      });
      
      if (error) {
        console.error('Error creating embeddings:', error);
        return {
          success: false,
          error: error.message || 'Failed to create embeddings',
          content: '',
          metadata: {
            error: error.message || 'Failed to create embeddings'
          },
          documentId
        };
      }
      
      return {
        success: true,
        content: 'Embeddings created successfully',
        metadata: {
          processingMethod: 'embeddings',
          clientId,
          agentName,
          documentId
        },
        documentId,
        data
      };
    } catch (error) {
      console.error('Error in createEmbeddings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create embeddings',
        content: '',
        metadata: {
          error: error instanceof Error ? error.message : 'Failed to create embeddings'
        },
        documentId
      };
    }
  }

  /**
   * Adds a processed document to an OpenAI Assistant
   */
  static async addDocumentToOpenAIAssistant(
    clientId: string,
    agentName: string,
    documentContent: string,
    documentTitle: string
  ): Promise<ParseResponse> {
    try {
      const supabase = this.getSupabaseClient();
      console.log(`Adding document "${documentTitle}" to OpenAI Assistant for client ${clientId}`);
      
      // Get the OpenAI Assistant ID for this client
      const result = await supabase
        .from("ai_agents")
        .select("openai_assistant_id")
        .eq("client_id", clientId)
        .eq("interaction_type", "config")
        .single();
      
      // Properly handle errors and check for the column
      if (result.error) {
        console.error('Error finding OpenAI Assistant ID for this client:', result.error);
        
        // Special handling for missing column error
        if (result.error.message?.includes("column 'openai_assistant_id' does not exist")) {
          console.error('The openai_assistant_id column is missing. Running migration...');
          
          // Run the migration to add the column via the Edge Function
          const { data: migrationData, error: migrationError } = await supabase.functions.invoke('execute_sql', {
            method: 'POST',
            body: {
              sql: `ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS openai_assistant_id text;`
            },
          });
          
          if (migrationError) {
            console.error('Failed to add openai_assistant_id column:', migrationError);
            return {
              success: false,
              error: `Failed to add openai_assistant_id column: ${migrationError}`,
              content: '',
              metadata: {
                error: `Failed to add openai_assistant_id column: ${migrationError}`
              },
              documentId: `error-${Date.now()}`
            };
          }
          
          console.log('Successfully added openai_assistant_id column');
        }
        
        // Create a new OpenAI Assistant for this client
        const { data: createData, error: createError } = await supabase.functions.invoke('create-openai-assistant', {
          method: 'POST',
          body: {
            client_id: clientId,
            agent_name: agentName,
            agent_description: `Assistant for ${agentName}`,
          },
        });
        
        if (createError || !createData?.assistant_id) {
          console.error('Failed to create OpenAI Assistant:', createError);
          return {
            success: false,
            error: createError?.message || 'Failed to create OpenAI Assistant',
            content: '',
            metadata: {
              error: createError?.message || 'Failed to create OpenAI Assistant'
            },
            documentId: `error-${Date.now()}`
          };
        }
        
        // The new assistant_id will be used in the subsequent call to upload-document-to-assistant
      } else if (!result.data || !result.data.openai_assistant_id) {
        console.log('No openai_assistant_id found for this client. Creating new assistant...');
        
        // Create a new OpenAI Assistant for this client
        const { data: createData, error: createError } = await supabase.functions.invoke('create-openai-assistant', {
          method: 'POST',
          body: {
            client_id: clientId,
            agent_name: agentName,
            agent_description: `Assistant for ${agentName}`,
          },
        });
        
        if (createError || !createData?.assistant_id) {
          console.error('Failed to create OpenAI Assistant:', createError);
          return {
            success: false,
            error: createError?.message || 'Failed to create OpenAI Assistant',
            content: '',
            metadata: {
              error: createError?.message || 'Failed to create OpenAI Assistant'
            },
            documentId: `error-${Date.now()}`
          };
        }
        
        console.log('Created new OpenAI Assistant with ID:', createData.assistant_id);
      } else {
        console.log('Found existing OpenAI Assistant ID:', result.data.openai_assistant_id);
      }
      
      // Now call the Supabase function to add the document to the assistant
      const { data, error } = await supabase.functions.invoke('upload-document-to-assistant', {
        method: 'POST',
        body: {
          clientId,
          agentName,
          documentContent,
          documentTitle
        },
      });
      
      if (error) {
        console.error('Error adding document to OpenAI Assistant:', error);
        return {
          success: false,
          error: error.message || 'Failed to add document to OpenAI Assistant',
          content: '',
          metadata: {
            error: error.message || 'Failed to add document to OpenAI Assistant'
          },
          documentId: `error-${Date.now()}`
        };
      }
      
      console.log('Successfully added document to OpenAI Assistant:', data);
      
      return {
        success: true,
        content: documentContent.substring(0, 100) + '...',
        metadata: {
          title: documentTitle,
          processingMethod: 'openai-assistant',
          assistantId: data.assistant_id,
          fileId: data.file_id
        },
        documentId: `openai-${data.file_id}`,
        data
      };
    } catch (error) {
      console.error('Error in addDocumentToOpenAIAssistant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add document to OpenAI Assistant',
        content: '',
        metadata: {
          error: error instanceof Error ? error.message : 'Failed to add document to OpenAI Assistant'
        },
        documentId: `error-${Date.now()}`
      };
    }
  }

  /**
   * Verifies that all required components for OpenAI Assistant integration are in place
   */
  static async verifyAssistantIntegration(): Promise<ParseResponse> {
    try {
      const supabase = this.getSupabaseClient();
      console.log('Verifying document processing components...');
      
      // Check 1: Verify required API keys for document processing
      const { data: secretsData, error: secretsError } = await supabase.functions.invoke('check-secrets', {
        method: 'POST',
        body: { 
          required: ['LLAMA_CLOUD_API_KEY', 'FIRECRAWL_API_KEY'] 
        },
        headers: {
          'LLAMA_CLOUD_API_KEY': process.env.VITE_LLAMA_CLOUD_API_KEY || '',
          'FIRECRAWL_API_KEY': process.env.FIRECRAWL_API_KEY || ''
        }
      });
      
      if (secretsError || !secretsData?.success) {
        return {
          success: false,
          error: 'Missing required API keys: ' + (secretsData?.missing?.join(', ') || 'Unknown'),
          content: '',
          metadata: {
            error: 'Missing required API keys'
          },
          documentId: `verify-${Date.now()}`
        };
      }
      
      // Check 2: Verify the document processing function is deployed
      const requiredFunctions = ['process-document'];
      
      let missingFunctions = [];
      for (const funcName of requiredFunctions) {
        try {
          const testBody = {
            documentUrl: 'https://example.com/test.pdf',
            documentType: 'pdf',
            clientId: 'test-client',
            agentName: 'test-agent',
            documentId: 'test-doc-' + Date.now()
          };

          const { error } = await supabase.functions.invoke(funcName, {
            method: 'POST',
            body: testBody
          });
          
          if (error) {
            console.error(`Edge function ${funcName} appears to be unavailable:`, error);
            missingFunctions.push(funcName);
          }
        } catch (e) {
          console.error(`Edge function ${funcName} appears to be missing:`, e);
          missingFunctions.push(funcName);
        }
      }
      
      if (missingFunctions.length > 0) {
        return {
          success: false,
          error: `Required Edge Functions are not deployed correctly: ${missingFunctions.join(', ')}`,
          content: '',
          metadata: {
            error: `Required Edge Functions are not deployed correctly: ${missingFunctions.join(', ')}`
          },
          documentId: `verify-${Date.now()}`
        };
      }
      
      // Check 3: Verify document storage bucket exists
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('documents');
      
      if (bucketError) {
        return {
          success: false,
          error: 'Document storage bucket is missing or inaccessible',
          content: '',
          metadata: {
            error: 'Document storage bucket is missing or inaccessible'
          },
          documentId: `verify-${Date.now()}`
        };
      }
      
            return {
        success: true,
        content: 'All required components for document processing are in place',
              metadata: {
          processingMethod: 'verify-document-processing'
              },
              documentId: `verify-${Date.now()}`
            };
      } catch (error) {
      console.error('Error in verifyAssistantIntegration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify document processing components',
        content: '',
        metadata: {
          error: error instanceof Error ? error.message : 'Failed to verify document processing components'
        },
        documentId: `verify-${Date.now()}`
      };
    }
  }

  static async runDatabaseMigrations(): Promise<ParseResponse> {
    try {
      const supabase = this.getSupabaseClient();
      // ... existing code ...
    } catch (error) {
      console.error('Error in runDatabaseMigrations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run database migrations',
        content: '',
        metadata: {
          error: error instanceof Error ? error.message : 'Failed to run database migrations'
        },
        documentId: `verify-${Date.now()}`
      };
    }
  }
}