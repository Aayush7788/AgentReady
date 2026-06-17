import { isConfigurationError } from "./env";

export interface ApiErrorPayload {
  error: string;
  message: string;
  missing?: string[];
}

export function toApiError(
  error: unknown,
  fallback: { error: string; message: string },
): { body: ApiErrorPayload; status: number } {
  if (isConfigurationError(error)) {
    return {
      status: 503,
      body: {
        error: error.code,
        message: error.message,
        missing: error.missing,
      },
    };
  }

  return {
    status: 500,
    body: {
      error: fallback.error,
      message: error instanceof Error ? error.message : fallback.message,
    },
  };
}

