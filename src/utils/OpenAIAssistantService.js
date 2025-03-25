const OpenAI = require('openai');

class OpenAIAssistantService {
  constructor(config) {
    this.openai = new OpenAI({
      apiKey: config.apiKey
    });
  }

  async createAssistant({ name, description, content }) {
    try {
      console.log('Creating OpenAI Assistant...');
      console.log('Name:', name);
      console.log('Description:', description);
      
      const assistant = await this.openai.beta.assistants.create({
        name: name,
        description: description,
        model: "gpt-4-turbo-preview",
        tools: [
          {
            type: "retrieval",
            retrieval: {
              file_ids: []
            }
          }
        ],
        instructions: `You are an AI assistant specialized in helping clients with their documents. 
        Your name is ${name}. 
        ${description}
        
        You have access to the following document content:
        ${content}
        
        Use this content to provide accurate and helpful responses to client queries. 
        Always maintain a professional and friendly tone.`
      });

      console.log('Assistant created successfully:', assistant.id);
      return assistant;
    } catch (error) {
      console.error('Failed to create OpenAI Assistant:', error);
      throw new Error(`Failed to create OpenAI Assistant: ${error.message}`);
    }
  }

  async updateAssistant(assistantId, { content }) {
    try {
      console.log('Updating OpenAI Assistant...');
      console.log('Assistant ID:', assistantId);
      
      const assistant = await this.openai.beta.assistants.update(
        assistantId,
        {
          instructions: `You are an AI assistant specialized in helping clients with their documents. 
          You have access to the following document content:
          ${content}
          
          Use this content to provide accurate and helpful responses to client queries. 
          Always maintain a professional and friendly tone.`
        }
      );

      console.log('Assistant updated successfully');
      return assistant;
    } catch (error) {
      console.error('Failed to update OpenAI Assistant:', error);
      throw new Error(`Failed to update OpenAI Assistant: ${error.message}`);
    }
  }

  async deleteAssistant(assistantId) {
    try {
      console.log('Deleting OpenAI Assistant...');
      console.log('Assistant ID:', assistantId);
      
      await this.openai.beta.assistants.del(assistantId);
      console.log('Assistant deleted successfully');
    } catch (error) {
      console.error('Failed to delete OpenAI Assistant:', error);
      throw new Error(`Failed to delete OpenAI Assistant: ${error.message}`);
    }
  }
}

module.exports = { OpenAIAssistantService }; 