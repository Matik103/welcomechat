
import { supabase } from "@/integrations/supabase/client";
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

/**
 * Create a new assistant for a client
 * @param clientId Client identifier
 * @param agentName Name of the AI agent
 * @param prompt The instruction prompt for the assistant
 * @returns Created assistant data
 */
export const createAssistant = async (
  clientId: string,
  agentName: string,
  prompt: string
) => {
  try {
    console.log("Creating OpenAI assistant for:", agentName);
    
    if (!openai.apiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Create the assistant
    const assistant = await openai.beta.assistants.create({
      name: agentName,
      instructions: prompt || "You are a helpful assistant that answers questions based on the provided documents.",
      model: "gpt-4-turbo-preview",
      tools: [{ type: "retrieval" }]
    });
    
    console.log("Assistant created:", assistant.id);
    
    // Store the assistant ID in the client record
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({ 
        openai_assistant_id: assistant.id,
        settings: {
          assistant_id: assistant.id,
          model: "gpt-4-turbo-preview"
        }
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');
    
    if (updateError) {
      console.error("Error updating client with assistant ID:", updateError);
      throw updateError;
    }
    
    return {
      assistant_id: assistant.id,
      success: true
    };
  } catch (error) {
    console.error("Error creating OpenAI assistant:", error);
    
    return {
      error: error instanceof Error ? error.message : "Unknown error creating assistant",
      success: false
    };
  }
};

/**
 * Update an existing assistant
 * @param assistantId OpenAI Assistant ID
 * @param name New name for the assistant
 * @param instructions New instructions for the assistant
 */
export const updateAssistant = async (
  assistantId: string,
  name?: string,
  instructions?: string
) => {
  try {
    console.log("Updating assistant:", assistantId);
    
    if (!openai.apiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const updateParams: any = {};
    
    if (name) updateParams.name = name;
    if (instructions) updateParams.instructions = instructions;
    
    // Only update if there are changes
    if (Object.keys(updateParams).length === 0) {
      return { success: true, message: "No changes to update" };
    }
    
    // Update the assistant
    const assistant = await openai.beta.assistants.update(
      assistantId,
      updateParams
    );
    
    return {
      success: true,
      assistant_id: assistant.id
    };
  } catch (error) {
    console.error("Error updating OpenAI assistant:", error);
    
    return {
      error: error instanceof Error ? error.message : "Unknown error updating assistant",
      success: false
    };
  }
};

/**
 * Add a document to an assistant
 * @param assistantId The OpenAI Assistant ID
 * @param fileId The OpenAI File ID
 */
export const addDocumentToAssistant = async (
  assistantId: string,
  fileId: string
) => {
  try {
    console.log(`Adding file ${fileId} to assistant ${assistantId}`);
    
    if (!openai.apiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // First get the current file IDs to avoid duplicates
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    
    // Update the assistant with the new file
    await openai.beta.assistants.update(assistantId, {
      file_ids: [...(assistant.file_ids || []), fileId]
    });
    
    return {
      success: true,
      message: `File ${fileId} added to assistant ${assistantId}`
    };
  } catch (error) {
    console.error("Error adding document to assistant:", error);
    
    return {
      error: error instanceof Error ? error.message : "Unknown error adding document",
      success: false
    };
  }
};

/**
 * Upload a document to OpenAI for use with an assistant
 * @param documentUrl URL to the document to upload
 * @param purpose Purpose of the document (default: 'assistants')
 */
export const uploadDocumentToOpenAI = async (
  documentUrl: string,
  purpose: 'assistants' = 'assistants'
) => {
  try {
    console.log("Uploading document to OpenAI:", documentUrl);
    
    if (!openai.apiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Download the file from the URL
    const response = await fetch(documentUrl);
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const fileName = documentUrl.split('/').pop() || 'document';
    
    // Create a File object
    const file = new File([blob], fileName, { type: blob.type });
    
    // Upload the file to OpenAI
    const uploadedFile = await openai.files.create({
      file,
      purpose
    });
    
    console.log("Document uploaded to OpenAI:", uploadedFile.id);
    
    return {
      success: true,
      file_id: uploadedFile.id,
      filename: fileName
    };
  } catch (error) {
    console.error("Error uploading document to OpenAI:", error);
    
    return {
      error: error instanceof Error ? error.message : "Unknown error uploading document",
      success: false
    };
  }
};
