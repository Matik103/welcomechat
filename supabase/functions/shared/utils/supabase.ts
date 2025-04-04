
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { AppError, errorCodes } from "../middleware/errorHandler.ts";
import type { DocumentContent } from "../types/index.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

export const storeDocument = async (
  clientId: string,
  content: string,
  embedding: number[],
  metadata: Record<string, unknown>
): Promise<DocumentContent> => {
  try {
    const { data, error } = await supabase
      .from("document_content")
      .insert({
        client_id: clientId,
        content,
        embedding,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Database Error:", error);
    throw new AppError(
      500,
      "Failed to store document",
      errorCodes.DATABASE_ERROR,
      error
    );
  }
};

export const findSimilarDocuments = async (
  embedding: number[],
  matchThreshold = 0.8,
  matchCount = 3
): Promise<Array<{ content: string; similarity: number }>> => {
  try {
    const { data, error } = await supabase.rpc("match_documents_by_embedding", {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Database Error:", error);
    throw new AppError(
      500,
      "Failed to find similar documents",
      errorCodes.DATABASE_ERROR,
      error
    );
  }
};

export const storeFile = async (
  clientId: string,
  fileName: string,
  fileData: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from("client_documents")
      .upload(`${clientId}/${fileName}`, fileData);

    if (error) throw error;
    return data.path;
  } catch (error) {
    console.error("Storage Error:", error);
    throw new AppError(
      500,
      "Failed to store file",
      errorCodes.DATABASE_ERROR,
      error
    );
  }
}; 
