import { type CoinGeckoSimplePriceResponse, type CryptoAsset, type CryptoId } from "../contracts/crypto.ts";
import { type ApiErrorDetails } from "../errors/ProviderError.ts";
export declare function mapCoinGeckoResponse(data: CoinGeckoSimplePriceResponse, ids?: readonly CryptoId[]): CryptoAsset[];
export declare function getCryptoPrices(apiKey: string | undefined, ids?: readonly CryptoId[]): Promise<CryptoAsset[]>;
export declare function getCryptoApiError(error: unknown): ApiErrorDetails;
