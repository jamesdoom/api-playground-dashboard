export type ProviderErrorCode = "not_configured" | "not_found" | "unauthorized" | "unavailable";
export declare class ProviderError extends Error {
    readonly code: ProviderErrorCode;
    constructor(code: ProviderErrorCode, message: string);
}
export interface ApiErrorDetails {
    statusCode: number;
    message: string;
}
