export type ProviderErrorCode = "not_configured" | "not_found" | "unauthorized" | "unavailable";

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;

  constructor(code: ProviderErrorCode, message: string) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
  }
}

export interface ApiErrorDetails {
  statusCode: number;
  message: string;
}
