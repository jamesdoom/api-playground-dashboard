export class ProviderError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = "ProviderError";
        this.code = code;
    }
}
