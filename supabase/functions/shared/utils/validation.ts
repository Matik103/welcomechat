import { AppError, errorCodes } from "../middleware/errorHandler.ts";
import type { UploadRequest, QueryRequest } from "../types/index.ts";

const MAX_FILE_SIZE = parseInt(Deno.env.get("MAX_FILE_SIZE") ?? "10485760"); // 10MB default

export const validateUploadRequest = (request: unknown): UploadRequest => {
  if (!request || typeof request !== "object") {
    throw new AppError(400, "Invalid request body", errorCodes.INVALID_INPUT);
  }

  const { client_id, file_name, file_data } = request as Record<string, unknown>;

  if (!client_id || typeof client_id !== "string") {
    throw new AppError(400, "Invalid client_id", errorCodes.INVALID_INPUT);
  }

  if (!file_name || typeof file_name !== "string") {
    throw new AppError(400, "Invalid file_name", errorCodes.INVALID_INPUT);
  }

  if (!file_data || typeof file_data !== "string") {
    throw new AppError(400, "Invalid file_data", errorCodes.INVALID_INPUT);
  }

  if (file_data.length > MAX_FILE_SIZE) {
    throw new AppError(
      400,
      `File size exceeds limit of ${MAX_FILE_SIZE} bytes`,
      errorCodes.FILE_TOO_LARGE
    );
  }

  return { client_id, file_name, file_data };
};

export const validateQueryRequest = (request: unknown): QueryRequest => {
  if (!request || typeof request !== "object") {
    throw new AppError(400, "Invalid request body", errorCodes.INVALID_INPUT);
  }

  const { client_id, query } = request as Record<string, unknown>;

  if (!client_id || typeof client_id !== "string") {
    throw new AppError(400, "Invalid client_id", errorCodes.INVALID_INPUT);
  }

  if (!query || typeof query !== "string") {
    throw new AppError(400, "Invalid query", errorCodes.INVALID_INPUT);
  }

  if (query.length > 1000) {
    throw new AppError(
      400,
      "Query length exceeds 1000 characters",
      errorCodes.INVALID_INPUT
    );
  }

  return { client_id, query };
};

export const validateAuthHeader = (authHeader: string | null): void => {
  if (!authHeader) {
    throw new AppError(401, "Missing authorization header", errorCodes.UNAUTHORIZED);
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new AppError(
      401,
      "Invalid authorization header format",
      errorCodes.UNAUTHORIZED
    );
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    throw new AppError(401, "Missing token", errorCodes.UNAUTHORIZED);
  }
}; 