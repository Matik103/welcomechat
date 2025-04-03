import { Configuration, OpenAIApi } from "https://esm.sh/openai@4.28.0";
import { AppError, errorCodes } from "../middleware/errorHandler.ts";

const openai = new OpenAIApi(
  new Configuration({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  })
);

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: text,
    });

    return response.data.data[0].embedding;
  } catch (error) {
    console.error("OpenAI Embedding Error:", error);
    throw new AppError(
      500,
      "Failed to generate embedding",
      errorCodes.OPENAI_ERROR,
      error
    );
  }
};

export const generateAnswer = async (
  query: string,
  documents: Array<{ content: string; similarity: number }>
): Promise<string> => {
  try {
    const prompt = `Based on the following documents, answer the question: "${query}"\n\nDocuments:\n${documents
      .map((doc) => doc.content)
      .join("\n\n")}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that answers questions based on the provided documents.",
        },
        { role: "user", content: prompt },
      ],
    });

    return completion.data.choices[0].message?.content ?? "No answer generated";
  } catch (error) {
    console.error("OpenAI Answer Generation Error:", error);
    throw new AppError(
      500,
      "Failed to generate answer",
      errorCodes.OPENAI_ERROR,
      error
    );
  }
}; 